package ir.alaviyar.alavi;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/** ذخیره‌ی رمزنگاری‌شده‌ی اطلاعات ورود (فقط روی خود گوشی). */
final class SecureStore {
    private static final String PREFS = "alaviyar_secure";
    private static final String ALIAS = "alaviyar_key";
    private final SharedPreferences prefs;

    SecureStore(Context c) { prefs = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    private SecretKey key() throws Exception {
        if (Build.VERSION.SDK_INT >= 23) {
            KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
            ks.load(null);
            if (!ks.containsAlias(ALIAS)) {
                KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(256).build());
                return g.generateKey();
            }
            return (SecretKey) ks.getKey(ALIAS, null);
        }
        // اندروید ۵: کلید تصادفی در حافظه‌ی خصوصی برنامه (خارج از دسترس برنامه‌های دیگر)
        String k = prefs.getString("k", null);
        if (k == null) {
            byte[] b = new byte[32];
            new SecureRandom().nextBytes(b);
            k = Base64.encodeToString(b, Base64.NO_WRAP);
            prefs.edit().putString("k", k).apply();
        }
        return new SecretKeySpec(Base64.decode(k, Base64.NO_WRAP), "AES");
    }

    void save(String plain) {
        try {
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            byte[] iv = new byte[12];
            if (Build.VERSION.SDK_INT >= 23) {
                c.init(Cipher.ENCRYPT_MODE, key());
                iv = c.getIV();
            } else {
                new SecureRandom().nextBytes(iv);
                c.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            }
            byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            prefs.edit().putString("d", Base64.encodeToString(iv, Base64.NO_WRAP) + ":" + Base64.encodeToString(ct, Base64.NO_WRAP)).apply();
        } catch (Exception e) {
            prefs.edit().remove("d").apply();
        }
    }

    String load() {
        try {
            String d = prefs.getString("d", null);
            if (d == null) return null;
            String[] p = d.split(":");
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(p[0], Base64.NO_WRAP)));
            return new String(c.doFinal(Base64.decode(p[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            clear();
            return null;
        }
    }

    void clear() { prefs.edit().remove("d").apply(); }
}
