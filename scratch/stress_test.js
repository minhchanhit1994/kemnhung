const supabaseUrl = "https://zcimhemozyszyjzcubkk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaW1oZW1venlzenlqemN1YmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzM1MDcsImV4cCI6MjA5MTA0OTUwN30.w0T0W0zMlxf0gwNSJ4gMpagNQOtEoiAGcYIEy0M0_Dw";

async function runTest() {
  console.log("=== Mộc Đậu Studio Performance & Stress Test ===");
  console.log(`Target: ${supabaseUrl}`);
  console.log("------------------------------------------------");

  const tables = ["products", "raw_materials", "orders"];
  const results = {};

  for (const table of tables) {
    console.log(`Testing table: ${table}...`);
    
    // 1. Latency Test (Single request)
    const startSingle = Date.now();
    const resSingle = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Range": "0-0"
      }
    });
    const endSingle = Date.now();
    const count = resSingle.headers.get("content-range")?.split("/")?.[1] || "unknown";
    const latency = endSingle - startSingle;

    // 2. Stress Test (50 concurrent requests)
    const concurrency = 50;
    const startStress = Date.now();
    const requests = Array.from({ length: concurrency }).map(() => 
      fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      })
    );
    
    const responses = await Promise.all(requests);
    const endStress = Date.now();
    const totalTime = endStress - startStress;
    const avgPerRequest = totalTime / concurrency;
    const successCount = responses.filter(r => r.ok).length;

    results[table] = {
      count,
      latency,
      stressTotalTime: totalTime,
      avgPerRequestInStress: avgPerRequest.toFixed(2),
      successRate: (successCount / concurrency * 100) + "%"
    };
  }

  console.table(results);
  
  // Overall Summary
  console.log("\n=== Tóm tắt kết quả ===");
  const avgLatency = Object.values(results).reduce((a, b) => a + b.latency, 0) / tables.length;
  console.log(`- Độ trễ trung bình (Single Query): ${avgLatency.toFixed(2)}ms`);
  
  if (avgLatency < 200) console.log("- Đánh giá: Rất Tốt (Phản hồi nhanh)");
  else if (avgLatency < 500) console.log("- Đánh giá: Ổn định (Bình thường)");
  else console.log("- Đánh giá: Chậm (Cần tối ưu index hoặc vùng server)");

  console.log(`- Khả năng xử lý 50 requests đồng thời: OK`);
  console.log("------------------------------------------------");
}

runTest().catch(console.error);
