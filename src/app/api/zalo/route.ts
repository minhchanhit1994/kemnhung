import { NextRequest, NextResponse } from 'next/server'

// /api/zalo?phone=372407322
// Fallback page for mobile when Zalo deep link fails
// Uses zalo:// URI scheme with country code, then shows manual instructions
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') || ''
  const shopName = request.nextUrl.searchParams.get('shop') || 'Mộc Đậu Decor'

  if (!phone) {
    return NextResponse.redirect('/')
  }

  // Clean phone: remove leading 0, add Vietnam country code 84
  const phoneNoLeadingZero = phone.replace(/^0/, '')
  const phoneWithCC = `84${phoneNoLeadingZero}`
  const displayPhone = phone.startsWith('0') ? phone : `0${phone}`
  const zaloWebUrl = `https://zalo.me/${phoneNoLeadingZero}`
  const telUrl = `tel:${displayPhone}`

  // Return a self-contained HTML page that opens Zalo via URI scheme
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Đang mở Zalo...</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:#f0faf4;color:#0f4232;min-height:100vh;display:flex;
  align-items:center;justify-content:center;text-align:center;padding:20px}
.container{max-width:360px;width:100%}
.spinner{width:40px;height:40px;border:3px solid #d0f0de;
  border-top-color:#1a6b4f;border-radius:50%;animation:spin 0.8s linear infinite;
  margin:0 auto 20px}
@keyframes spin{to{transform:rotate(360deg)}}
h2{font-size:18px;margin-bottom:8px;color:#1a6b4f}
p{font-size:14px;color:#4a7d65;margin-bottom:16px;line-height:1.5}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 24px;border-radius:25px;font-size:15px;font-weight:600;
  text-decoration:none;margin:6px;transition:all 0.2s}
.btn-primary{background:#1a6b4f;color:white}
.btn-primary:hover{background:#0f4232}
.btn-outline{background:white;color:#1a6b4f;border:1.5px solid #a7dfc1}
.btn-outline:hover{background:#d0f0de}
.fallback{margin-top:0;padding:20px;background:white;border-radius:16px;
  border:1px solid #a7dfc1;display:none;box-shadow:0 2px 12px rgba(0,0,0,0.06)}
.fallback h2{font-size:16px;margin-bottom:4px;color:#c97856}
.fallback .subtitle{font-size:13px;color:#6b8f7e;margin-bottom:16px}
.steps{text-align:left;font-size:13px;line-height:2;color:#4a7d65;
  background:#f0faf4;border-radius:10px;padding:12px 16px;margin-top:16px}
.steps b{color:#1a6b4f}
.fade-in{animation:fadeIn 0.3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
#loading{transition:opacity 0.3s}
#result{display:none}
.btn-group{display:flex;flex-direction:column;gap:8px;margin-top:4px}
</style>
</head>
<body>
<div class="container">
  <div id="loading">
    <div class="spinner"></div>
    <h2>Đang mở Zalo...</h2>
    <p>${shopName}</p>
  </div>
  <div id="result"></div>
</div>
<script>
(function() {
  var phoneWithCC = "${phoneWithCC}";
  var displayPhone = "${displayPhone}";
  var zaloWebUrl = "${zaloWebUrl}";
  var telUrl = "${telUrl}";
  var shopName = "${shopName}";
  var appOpened = false;

  // === Detect when Zalo app opens (page goes to background) ===
  document.addEventListener("visibilitychange", function() {
    if (document.hidden) appOpened = true;
  });

  var blurTimer = null;
  window.addEventListener("blur", function() {
    blurTimer = setTimeout(function() { appOpened = true; }, 500);
  });
  window.addEventListener("focus", function() {
    if (blurTimer) clearTimeout(blurTimer);
  });

  function showResult(content) {
    var loading = document.getElementById("loading");
    var result = document.getElementById("result");
    if (loading) loading.style.opacity = "0";
    setTimeout(function() {
      if (loading) loading.style.display = "none";
      result.style.display = "block";
      result.innerHTML = content;
    }, 300);
  }

  function showFallback() {
    if (appOpened) return;
    showResult(
      '<div class="fallback fade-in">' +
      '<h2>Không thể tự động mở Zalo</h2>' +
      '<p class="subtitle">Bạn có thể liên hệ theo các cách sau:</p>' +
      '<div class="btn-group">' +
      '<a href="' + telUrl + '" class="btn btn-primary" style="width:100%">\\uD83D\\uDCDE Gọi ' + displayPhone + '</a>' +
      '<a href="' + zaloWebUrl + '" class="btn btn-outline" style="width:100%">\\uD83D\\uDCAC Mở Zalo Web</a>' +
      '</div>' +
      '<div class="steps">' +
      '<b>Hướng dẫn chat Zalo:</b><br>' +
      '1. Mở ứng dụng <b>Zalo</b> trên điện thoại<br>' +
      '2. Nhấn <b>Tìm kiếm</b> (biểu tượng kính lúp)<br>' +
      '3. Nhập số <b>' + displayPhone + '</b><br>' +
      '4. Chọn kết quả và gửi tin nhắn cho <b>' + shopName + '</b>' +
      '</div>' +
      '</div>'
    );
  }

  // === Strategy 1: Try zalo:// URI scheme with country code ===
  var zaloUri = "zalo://conversation?phone=" + phoneWithCC;

  // On iOS, use direct location (Safari allows custom scheme with user gesture context)
  // On Android, try it but Chrome may block — we handle that with fallback
  var ua = navigator.userAgent || '';
  var isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    // === Strategy for Android: use intent:// URL ===
    // Chrome allows intent:// programmatically because it has built-in fallback
    var fallbackUrl = encodeURIComponent(zaloWebUrl);
    var intentUrl = "intent://conversation?phone=" + phoneWithCC +
      "#Intent;scheme=zalo;package=com.zing.zalo;S.browser_fallback_url=" + fallbackUrl + ";end";
    window.location.href = intentUrl;
  } else {
    // === Strategy for iOS and others: direct zalo:// URI scheme ===
    window.location.href = zaloUri;
  }

  // Fallback: if app didn't open within 3 seconds, show manual options
  setTimeout(function() {
    if (!appOpened) showFallback();
  }, 3000);
})();
</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
