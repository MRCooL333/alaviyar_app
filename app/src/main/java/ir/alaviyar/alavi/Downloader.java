package ir.alaviyar.alavi;

import android.app.DownloadManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URLDecoder;

/** دریافت فایل از سرور پرتال و ذخیره در پوشه‌ی دانلودهای گوشی. */
final class Downloader {
    static final class Saved { String name; String uri; String mime; }
    static final class SessionError extends Exception {}
    static final class PermissionError extends Exception {}

    private final Context ctx;
    Downloader(Context c) { ctx = c; }

    private static String fileName(HttpURLConnection c, String url) {
        String cd = c.getHeaderField("Content-Disposition");
        String name = null;
        if (cd != null) {
            try {
                int i = cd.toLowerCase().indexOf("filename*=");
                if (i >= 0) {
                    String v = cd.substring(i + 10).split(";")[0].trim();
                    int q = v.indexOf("''");
                    name = URLDecoder.decode(q >= 0 ? v.substring(q + 2) : v, "UTF-8");
                } else {
                    i = cd.toLowerCase().indexOf("filename=");
                    if (i >= 0) name = cd.substring(i + 9).split(";")[0].trim().replace("\"", "");
                }
            } catch (Exception ignored) { }
        }
        if (name == null || name.trim().isEmpty()) {
            String p = url.split("\\?")[0];
            name = p.substring(p.lastIndexOf('/') + 1);
            try { name = URLDecoder.decode(name, "UTF-8"); } catch (Exception ignored) { }
        }
        name = name.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_").trim();
        if (name.isEmpty()) name = "alaviyar-file";
        return name;
    }

    private static String mimeFor(String name, String headerType) {
        String ext = MimeTypeMap.getFileExtensionFromUrl(name.replace(" ", "_"));
        if (ext == null || ext.isEmpty()) { int d = name.lastIndexOf('.'); ext = d >= 0 ? name.substring(d + 1) : ""; }
        String m = ext.isEmpty() ? null : MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext.toLowerCase());
        if (m != null) return m;
        if (headerType != null && !headerType.isEmpty()) return headerType.split(";")[0].trim();
        return "application/octet-stream";
    }

    Saved download(String url, String headersJson) throws Exception {
        HttpURLConnection c = Net.open("GET", url, headersJson, true);
        try {
            int st = c.getResponseCode();
            if (st == 401 || st == 403) throw new SessionError();
            if (st != 200) throw new Exception("پرتال خطا داد (کد " + st + ")");
            String ct = c.getContentType() == null ? "" : c.getContentType();
            if (ct.toLowerCase().startsWith("text/html")) throw new SessionError();   // صفحه‌ی ورود به‌جای فایل
            String name = fileName(c, url);
            String mime = mimeFor(name, ct);
            Saved s = new Saved(); s.name = name; s.mime = mime;
            InputStream in = c.getInputStream();
            if (Build.VERSION.SDK_INT >= 29) {
                ContentResolver r = ctx.getContentResolver();
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                v.put(MediaStore.Downloads.MIME_TYPE, mime);
                v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/AlaviYar");
                v.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri u = r.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (u == null) throw new Exception("ذخیره‌ی فایل ممکن نشد");
                try {
                    OutputStream o = r.openOutputStream(u);
                    copy(in, o);
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.Downloads.IS_PENDING, 0);
                    r.update(u, done, null, null);
                } catch (Exception e) { r.delete(u, null, null); throw e; }
                s.uri = u.toString();
            } else {
                if (!Environment.MEDIA_MOUNTED.equals(Environment.getExternalStorageState())) throw new Exception("حافظه‌ی گوشی در دسترس نیست");
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "AlaviYar");
                if (!dir.exists() && !dir.mkdirs()) throw new PermissionError();
                File f = unique(dir, name);
                try { copy(in, new FileOutputStream(f)); } catch (java.io.FileNotFoundException e) { throw new PermissionError(); }
                s.name = f.getName();
                @SuppressWarnings("deprecation")
                long id = ((DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE))
                        .addCompletedDownload(f.getName(), "علوی یار", true, mime, f.getAbsolutePath(), f.length(), true);
                Uri u = ((DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE)).getUriForDownloadedFile(id);
                s.uri = u != null ? u.toString() : Uri.fromFile(f).toString();
            }
            return s;
        } finally { c.disconnect(); }
    }

    private static File unique(File dir, String name) {
        File f = new File(dir, name);
        if (!f.exists()) return f;
        int d = name.lastIndexOf('.');
        String base = d > 0 ? name.substring(0, d) : name, ext = d > 0 ? name.substring(d) : "";
        for (int i = 1; i < 1000; i++) { f = new File(dir, base + " (" + i + ")" + ext); if (!f.exists()) return f; }
        return f;
    }

    private static void copy(InputStream in, OutputStream out) throws Exception {
        try {
            byte[] b = new byte[16384]; int n;
            while ((n = in.read(b)) > 0) out.write(b, 0, n);
            out.flush();
        } finally { in.close(); out.close(); }
    }
}
