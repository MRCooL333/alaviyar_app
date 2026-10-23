package ir.alaviyar.alavi;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.widget.LinearLayout;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private WebView web;
    private View topBar, bottomBar;
    private SecureStore store;
    private Downloader downloader;
    private final ExecutorService pool = Executors.newFixedThreadPool(3);
    private int insetTop = 0, insetBottom = 0;
    private long lastBack = 0;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        store = new SecureStore(this);
        downloader = new Downloader(this);
        final int forest = Color.parseColor("#064A30");

        Window w = getWindow();
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 29) { w.setNavigationBarContrastEnforced(false); w.setStatusBarContrastEnforced(false); }
        w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(forest);
        topBar = new View(this); topBar.setBackgroundColor(forest);
        bottomBar = new View(this); bottomBar.setBackgroundColor(forest);
        web = new WebView(this);
        web.setBackgroundColor(forest);
        root.addView(topBar, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0));
        root.addView(web, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(bottomBar, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0));
        setContentView(root);

        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int t, bt;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets sys = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = insets.getInsets(WindowInsets.Type.ime());
                t = sys.top; bt = Math.max(sys.bottom, ime.bottom);
            } else {
                t = insets.getSystemWindowInsetTop(); bt = insets.getSystemWindowInsetBottom();
            }
            insetTop = t; insetBottom = bt;
            topBar.getLayoutParams().height = t;
            bottomBar.getLayoutParams().height = bt;
            topBar.requestLayout(); bottomBar.requestLayout();
            return insets;
        });
        root.requestApplyInsets();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u = r.getUrl().toString();
                if (u.startsWith("file:///android_asset/")) return false;
                openExternal(u);
                return true;
            }
        });
        web.loadUrl("file:///android_asset/index.html");

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, new OnBackInvokedCallback() {
                @Override public void onBackInvoked() { handleBack(); }
            });
        }
    }

    /** برگشت: اول از خود برنامه‌ی وب می‌پرسیم؛ اگر کاری نداشت، برنامه بسته می‌شود. */
    private void handleBack() {
        web.evaluateJavascript("(function(){try{return window.__back?window.__back():false}catch(e){return false}})()", new ValueCallback<String>() {
            @Override public void onReceiveValue(String v) {
                if (!"true".equals(v)) moveTaskToBack(true);
            }
        });
    }

    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() {
        handleBack();
    }

    private void openExternal(String url) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
        catch (ActivityNotFoundException ignored) { }
    }

    private void resolve(final int id, JSONObject o) {
        final String b64 = Base64.encodeToString(o.toString().getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
        runOnUiThread(() -> web.evaluateJavascript("window.__alaviResolve(" + id + ",'" + b64 + "')", null));
    }

    @Override protected void onDestroy() { pool.shutdownNow(); super.onDestroy(); }

    /** پلی که صفحه‌ی برنامه (جاوااسکریپت) با آن به گوشی وصل می‌شود. فقط از همین صفحه‌ی داخلی قابل دسترسی است. */
    private final class Bridge {
        @JavascriptInterface public void http(final int id, final String method, final String url, final String headers, final String body, final boolean follow) {
            pool.execute(() -> {
                JSONObject o = new JSONObject();
                try {
                    Net.Result r = Net.request(method, url, headers, body, follow);
                    o.put("status", r.status);
                    o.put("body", new String(r.body, StandardCharsets.UTF_8));
                } catch (Exception e) {
                    try { o.put("error", "network"); } catch (Exception ignored) { }
                }
                resolve(id, o);
            });
        }

        @JavascriptInterface public void download(final int id, final String url, final String headers) {
            if (Build.VERSION.SDK_INT >= 23 && Build.VERSION.SDK_INT <= 28
                    && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 7));
                JSONObject o = new JSONObject();
                try { o.put("error", "permission"); o.put("message", "برای ذخیره‌ی فایل اجازه‌ی «حافظه» را بده و دوباره دکمه را بزن."); } catch (Exception ignored) { }
                resolve(id, o);
                return;
            }
            pool.execute(() -> {
                JSONObject o = new JSONObject();
                try {
                    Downloader.Saved s = downloader.download(url, headers);
                    o.put("name", s.name); o.put("uri", s.uri); o.put("mime", s.mime);
                } catch (Downloader.SessionError e) {
                    try { o.put("error", "session"); } catch (Exception ignored) { }
                } catch (Downloader.PermissionError e) {
                    try { o.put("error", "permission"); o.put("message", "اجازه‌ی ذخیره‌ی فایل داده نشده است."); } catch (Exception ignored) { }
                } catch (Exception e) {
                    try { o.put("error", "failed"); o.put("message", "دریافت فایل ممکن نشد. اینترنت را بررسی کن و دوباره تلاش کن."); } catch (Exception ignored) { }
                }
                resolve(id, o);
            });
        }

        @JavascriptInterface public void saveCreds(String json) { store.save(json); }
        @JavascriptInterface public String loadCreds() { return store.load(); }
        @JavascriptInterface public void clearCreds() { store.clear(); }

        @JavascriptInterface public void openUrl(final String url) {
            if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) return;
            runOnUiThread(() -> openExternal(url));
        }

        @JavascriptInterface public void openFile(final String uri, final String mime) {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(Intent.ACTION_VIEW);
                    i.setDataAndType(Uri.parse(uri), mime == null || mime.isEmpty() ? "*/*" : mime);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception e) {
                    android.widget.Toast.makeText(MainActivity.this, "برنامه‌ای برای باز کردن این فایل پیدا نشد. از پوشه‌ی دانلودها بازش کن.", android.widget.Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface public void setChrome(final String top, final String bottom, final boolean lightIcons) {
            runOnUiThread(() -> {
                try {
                    int t = Color.parseColor(top), bt = Color.parseColor(bottom);
                    topBar.setBackgroundColor(t); bottomBar.setBackgroundColor(bt);
                    web.setBackgroundColor(bt);
                    View d = getWindow().getDecorView();
                    int f = d.getSystemUiVisibility();
                    if (Build.VERSION.SDK_INT >= 23) f &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;           // نوار بالا همیشه تیره است → آیکن‌ها روشن
                    if (Build.VERSION.SDK_INT >= 26) { if (lightIcons) f &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR; else f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR; }
                    d.setSystemUiVisibility(f);
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface public void exitApp() { runOnUiThread(() -> moveTaskToBack(true)); }
    }
}
