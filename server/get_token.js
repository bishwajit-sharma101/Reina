async function getToken() {
  const res = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "tester@astrix.com", password: "password123" })
  });
  const cookie = res.headers.get("set-cookie");
  const token = cookie ? cookie.split(";")[0].split("=")[1] : null;
  console.log(token);
}
getToken();
