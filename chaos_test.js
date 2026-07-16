const { io } = require("socket.io-client");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config({ path: __dirname + "/.env" });

// CONFIG
const NUM_CLIENTS = 500;
const SERVER_URL = "http://localhost:5000";
const SECRET = process.env.JWT_SECRET || "dummysecret"; // Fallback if no .env loaded here
const TEST_DURATION_SEC = 30; // 30 second barrage

// METRICS
let connectedCount = 0;
let disconnectedCount = 0;
let messagesSent = 0;
let messagesAcked = 0;
let aiRequests = 0;
let aiSuccess = 0;
let aiFailures = 0;
let latencies = [];

// Track server state
const serverMetricsHistory = [];

// Helper
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const generateDummyId = (index) => {
    // 24 char hex
    const hex = index.toString(16).padStart(24, '0');
    return hex;
};

const createClient = (index) => {
    const userId = generateDummyId(index);
    const token = jwt.sign({ id: userId }, SECRET, { expiresIn: '1h' });

    const socket = io(SERVER_URL, {
        auth: { token },
        reconnection: false, // Handle chaos manually
    });

    socket.on("connect", () => {
        connectedCount++;
        socket.emit("register-user", userId);
    });

    socket.on("disconnect", () => {
        disconnectedCount++;
        connectedCount--;
    });

    // Handle backpressure / DB response
    socket.on("private-message", (msg) => {
        if(msg.fromUserId === userId) {
             messagesAcked++;
             const latency = Date.now() - msg.timestamp;
             latencies.push(latency);
        }
    });

    socket.on("message-failed", (err) => {
        // Typically rate limit or DB error
        // console.warn("Msg failed", err);
    });

    return { socket, userId };
};

const startChaosTest = async () => {
    console.log(`🔥 Starting CHAOS STRESS TEST with ${NUM_CLIENTS} users...`);
    console.log(`⏳ Test duration: ${TEST_DURATION_SEC} seconds.`);

    const clients = [];

    // 1. Connection Storm
    console.log(`[1] Booting up ${NUM_CLIENTS} sockets...`);
    for (let i = 0; i < NUM_CLIENTS; i++) {
        clients.push(createClient(i));
        // Small delay to prevent local socket exhaustion error (ECONNRESET) on the OS level
        if (i % 50 === 0) await sleep(100); 
    }

    await sleep(3000); // Wait for storm to settle
    console.log(`✅ Sockets settled. Connected: ${connectedCount}`);

    // Metric Poller
    const metricPoller = setInterval(async () => {
        try {
            const res = await axios.get(`${SERVER_URL}/api/v1/metrics`);
            serverMetricsHistory.push(res.data);
        } catch (e) {
            // failed
        }
    }, 2000);

    // Chaos & Backpressure Loop
    const endTime = Date.now() + (TEST_DURATION_SEC * 1000);
    
    console.log(`[2] Unleashing the chaos (Message Spam, Drop Storms, AI Assault)...`);
    
    // AI Assurance Pool
    const aiTestLoop = async () => {
        while (Date.now() < endTime) {
            aiRequests++;
            try {
                // We send a tiny text to Gemini. 
                // To avoid true 429 quota exhaustion on an actual API, we will just blast this blindly and measure the queue degradation.
                const start = Date.now();
                await axios.post(`${SERVER_URL}/api/v1/ai/gemini`, {
                    text: `Hello ${Math.random()}`,
                    target_lang: "fr",
                    messageId: generateDummyId(9999), 
                }, { timeout: 10000 });
                aiSuccess++;
                latencies.push(Date.now() - start);
            } catch (err) {
                // Check if it's Timeout or 500
                aiFailures++;
            }
            await sleep(500); // 2 requests per second from this loop * 20 active loopers
        }
    };

    // Spin up 20 AI assault workers taking advantage of node's async IO
    for(let i=0; i<20; i++) aiTestLoop();

    // Spam loop
    while (Date.now() < endTime) {
        // Randomly pick a sender and receiver
        const senderInfo = clients[Math.floor(Math.random() * clients.length)];
        const receiverIndex = Math.floor(Math.random() * clients.length);
        const toUserId = generateDummyId(receiverIndex);

        if (senderInfo.socket.connected) {
            messagesSent++;
            senderInfo.socket.emit("private-message", {
                toUserId,
                message: "Spam barrage " + messagesSent,
                timestamp: Date.now()
            });
        }

        // Random disconnect storm (Chaos Engine)
        // 1% chance every tick to randomly kill a socket and reconnect
        if (Math.random() < 0.01) {
            const victim = clients[Math.floor(Math.random() * clients.length)];
            if(victim.socket.connected) {
                victim.socket.disconnect();
                // attempt reconnect later
                setTimeout(() => victim.socket.connect(), 2000);
            }
        }

        await sleep(5); // Ultra-fast spam to build massive backpressure
    }

    clearInterval(metricPoller);

    // Give it a moment to catch up on queues
    console.log(`⏳ Test complete. Awaiting 5s for backpressure/queues to drain...`);
    await sleep(5000);

    for (const c of clients) c.socket.disconnect();

    // Compile Reports
    const avgLatency = latencies.length ? latencies.reduce((a,b)=>a+b, 0) / latencies.length : 0;
    const maxLag = Math.max(...serverMetricsHistory.map(m => m.eventLoopLagMs || 0));
    const maxHeap = Math.max(...serverMetricsHistory.map(m => m.memoryMb?.heapUsed || 0));

    console.log("\n==================================");
    console.log("       CHAOS METRICS REPORT       ");
    console.log("==================================");
    console.log(`Total Connections Attempted: ${NUM_CLIENTS}`);
    console.log(`Peak Concurrent Connections: ${connectedCount}`);
    console.log(`Total Disconnect Events (Chaos): ${disconnectedCount}`);
    console.log("\n--- Message & DB Backpressure ---");
    console.log(`Messages Emitted: ${messagesSent}`);
    console.log(`Messages Saved & Echoed (Acked): ${messagesAcked}`);
    const dropRate = messagesSent ? ((messagesSent - messagesAcked)/messagesSent * 100).toFixed(2) : 0;
    console.log(`Packet Drop Rate (Un-acked/Rate-Limited): ${dropRate}%`);
    console.log("\n--- AI Bottleneck ---");
    console.log(`AI Translation Requests: ${aiRequests}`);
    console.log(`AI Prompt Success: ${aiSuccess}`);
    console.log(`AI Failures (Timeouts/Errors): ${aiFailures}`);
    console.log("\n--- Server Health ---");
    console.log(`Avg Request Latency: ${avgLatency.toFixed(2)} ms`);
    console.log(`Peak Event Loop Lag: ${maxLag.toFixed(2)} ms`);
    console.log(`Peak Heap Output: ${maxHeap} MB`);
    console.log("==================================");

    process.exit(0);
};

startChaosTest();
