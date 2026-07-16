async function test() {
    const res = await fetch('https://html.duckduckgo.com/html/?q=current%20president%20of%20US', {
        headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    });
    const html = await res.text();
    const snippets = [...html.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi)];
    console.log(snippets.slice(0, 3).map(m => m[1].replace(/<[^>]+>/g, '').trim()).join('\n\n'));
}
test();
