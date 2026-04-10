import { NextRequest, NextResponse } from 'next/server'

// /api/zalo?phone=372407322
// Returns a minimal HTML page that tries multiple methods to open Zalo chat on mobile
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') || ''
  const shopName = request.nextUrl.searchParams.get('shop') || 'Mộc Đậu Decor'

  if (!phone) {
    return NextResponse.redirect('/')
  }

  const displayPhone = phone.startsWith('0') ? phone : `0${phone}`
  const zaloWebUrl = `https://zalo.me/${phone.replace(/^0/, '')}`
  const telUrl = `tel:${displayPhone}`

  // Return a self-contained HTML page that tries to open Zalo
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Đang mở Zalo...</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:#f0faf4;color:#0f4232;min-height:100vh;display:flex;
  align-items:center;justify-content:center;text-align:center;padding:20px}
.container{max-width:360px}
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
.fallback{margin-top:24px;padding:16px;background:white;border-radius:12px;
  border:1px solid #a7dfc1;display:none}
.fallback p{font-size:13px;margin-bottom:12px}
.steps{text-align:left;font-size:13px;line-height:1.8;color:#4a7d65}
.steps li{margin-bottom:4px}
.fade-in{animation:fadeIn 0.3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
#loading{transition:opacity 0.3s}
#result{display:none}
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
  var phone = "${phone}";
  var displayPhone = "${displayPhone}";
  var zaloUrl = "${zaloWebUrl}";
  var telUrl = "${telUrl}";
  var shopName = "${shopName}";
  var appOpened = false;
  var attempts = 0;

  function onAppOpened() {
    appOpened = true;
  }

  // Listen for app open (page goes to background)
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) onAppOpened();
  });
  window.addEventListener('blur', function() { onAppOpened(); });

  function showResult(content) {
    var loading = document.getElementById('loading');
    var result = document.getElementById('result');
    if (loading) loading.style.opacity = '0';
    setTimeout(function() {
      if (loading) loading.style.display = 'none';
      result.style.display = 'block';
      result.innerHTML = content;
    }, 300);
  }

  function showFallback() {
    if (appOpened) return;
    showResult(
      '<div class="fallback fade-in">' +
      '<h2 style="font-size:16px;margin-bottom:8px;color:#c97856">Không thể tự động mở Zalo</h2>' +
      '<p> Bạn có thể liên hệ theo cách thủ công:</p>' +
      '<a href="' + telUrl + '" class="btn btn-primary" style="width:100%">📞 Gọi ' + displayPhone + '</a>' +
      '<a href="' + zaloUrl + '" class="btn btn-outline" style="width:100%">💬 Mở Zalo Web</a>' +
      '<ol class="steps" style="margin-top:16px;padding-left:20px">' +
      '<li>Mở ứng dụng Zalo trên điện thoại</li>' +
      '<li>Nhấn <b>Thêm bạn</b> → <b>Tìm theo số điện thoại</b></li>' +
      '<li>Nhập số <b>' + displayPhone + '</b></li>' +
      '<li>Gửi tin nhắn cho ' + shopName + '</li>' +
      '</ol>' +
      '</div>'
    );
  }

  // === Strategy 1: Direct window.location (works on many devices) ===
  function tryDirect() {
    attempts++;
    window.location.href = zaloUrl;
    setTimeout(function() {
      if (!appOpened && attempts < 3) {
        showFallback();
      }
    }, 3000);
  }

  // === Strategy 2: Android Intent ===
  function tryIntent() {
    attempts++;
    var intentUrl = 'intent://zalo.me/' + phone + '#Intent;scheme=https;package=com.zing.zalo;end;';
    
    // Try opening via a hidden iframe to avoid navigation issues
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = intentUrl;
    document.body.appendChild(iframe);
    
    setTimeout(function() {
      document.body.removeChild(iframe);
      if (!appOpened) {
        // Fallback to direct
        tryDirect();
      }
    }, 1500);
  }

  // Detect platform
  var ua = navigator.userAgent || '';
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    // Android: try intent first, then fallback
    tryIntent();
  } else {
    // iOS and others: try direct navigation
    tryDirect();
  }
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
