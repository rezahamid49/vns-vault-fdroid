package com.vns.vault;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
        );

        Bridge bridge = getBridge();
        if (bridge == null) return;

        WebView webView = bridge.getWebView();
        if (webView == null) return;

        webView.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectIntoWebView(view);
            }
        });

        // چند بار هم با تأخیر (اگر onPageFinished زودتر از حد زده شود)
        webView.postDelayed(() -> injectIntoWebView(webView), 800);
        webView.postDelayed(() -> injectIntoWebView(webView), 2000);
        webView.postDelayed(() -> injectIntoWebView(webView), 4000);
    }

    @Override
    public void onResume() {
        super.onResume();
        try {
            Bridge bridge = getBridge();
            if (bridge != null && bridge.getWebView() != null) {
                injectIntoWebView(bridge.getWebView());
            }
        } catch (Exception ignored) {
        }
    }

    private void injectIntoWebView(WebView webView) {
        if (webView == null) return;

        final boolean enableCards = resolveEnableCards();
        final String flavor = enableCards ? "global" : "bazaar";

        final String js =
                "(function(){try{" +
                        "window.VNS_CONFIG={enableCards:" + enableCards + ",storeFlavor:'" + flavor + "'};" +
                        "localStorage.setItem('vns_enable_cards','" + enableCards + "');" +
                        "localStorage.setItem('vns_store_flavor','" + flavor + "');" +
                        "console.log('[VNS] flavor injected', window.VNS_CONFIG);" +
                        "}catch(e){console.log('[VNS] inject error', e);}})();";

        webView.post(() -> {
            try {
                webView.evaluateJavascript(js, null);
            } catch (Exception ignored) {
            }
        });
    }

    private boolean resolveEnableCards() {
        try {
            Class<?> bc = Class.forName("com.vns.vault.BuildConfig");
            Object value = bc.getField("ENABLE_CARDS").get(null);
            if (value instanceof Boolean) return (Boolean) value;
        } catch (Throwable ignored) {
        }

        try {
            int id = getResources().getIdentifier("enable_cards", "bool", getPackageName());
            if (id != 0) return getResources().getBoolean(id);
        } catch (Throwable ignored) {
        }

        return false;
    }
}