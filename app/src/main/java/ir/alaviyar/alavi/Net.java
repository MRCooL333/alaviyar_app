package ir.alaviyar.alavi;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

/** درخواست‌های شبکه به p.alavi.ir (فقط به همین دامنه). */
final class Net {
    static final String HOST = "p.alavi.ir";
    private static final String UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";

    static { if (CookieHandler.getDefault() == null) CookieHandler.setDefault(new CookieManager()); }

    static final class Result {
        int status; byte[] body = new byte[0]; String contentType = ""; String disposition = "";
    }

    static HttpURLConnection open(String method, String url, String headersJson, boolean follow) throws Exception {
        URL u = new URL(url);
        if (!"https".equals(u.getProtocol()) || !HOST.equalsIgnoreCase(u.getHost())) throw new SecurityException("blocked host");
        HttpURLConnection c = (HttpURLConnection) u.openConnection();
        c.setRequestMethod(method);
        c.setInstanceFollowRedirects(follow);
        c.setConnectTimeout(20000);
        c.setReadTimeout(40000);
        c.setRequestProperty("User-Agent", UA);
        c.setRequestProperty("Accept-Language", "fa,en;q=0.8");
        if (headersJson != null && headersJson.length() > 1) {
            JSONObject h = new JSONObject(headersJson);
            for (Iterator<String> it = h.keys(); it.hasNext(); ) { String k = it.next(); c.setRequestProperty(k, h.getString(k)); }
        }
        return c;
    }

    private static byte[] readAll(InputStream in) throws Exception {
        if (in == null) return new byte[0];
        try {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] b = new byte[16384]; int n;
            while ((n = in.read(b)) > 0) o.write(b, 0, n);
            return o.toByteArray();
        } finally { in.close(); }
    }

    static Result request(String method, String url, String headersJson, String body, boolean follow) throws Exception {
        HttpURLConnection c = open(method, url, headersJson, follow);
        try {
            if (body != null && body.length() > 0 && !"GET".equals(method)) {
                byte[] data = body.getBytes(StandardCharsets.UTF_8);
                c.setDoOutput(true);
                c.setFixedLengthStreamingMode(data.length);
                OutputStream os = c.getOutputStream(); os.write(data); os.close();
            }
            Result r = new Result();
            r.status = c.getResponseCode();
            r.contentType = c.getContentType() == null ? "" : c.getContentType();
            r.body = readAll(r.status >= 400 ? c.getErrorStream() : c.getInputStream());
            return r;
        } finally { c.disconnect(); }
    }
}
