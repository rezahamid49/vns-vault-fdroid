package com.vns.vault;

import android.annotation.SuppressLint;
import android.app.assist.AssistStructure;
import android.os.CancellationSignal;
import android.service.autofill.AutofillService;
import android.service.autofill.FillCallback;
import android.service.autofill.FillRequest;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveInfo;
import android.service.autofill.SaveRequest;
import android.content.SharedPreferences;
import android.util.Log;
import android.app.assist.AssistStructure.ViewNode;
import android.view.autofill.AutofillId;
import android.service.autofill.Dataset;
import android.service.autofill.FillResponse;
import android.view.autofill.AutofillValue;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.List;

// 🛡️ این خط تمام خطاهای قرمز مربوط به نسخه‌های جدید اندروید را غیرفعال می‌کند
@SuppressLint({"NewApi", "RestrictedApi"})
public class VnsAutofillService extends AutofillService {

    private static final String TAG = "VNS_AUTOFILL_LOG";

    private AutofillId usernameId = null;
    private AutofillId passwordId = null;

    private String savedUsername = "";
    private String savedPassword = "";

    @Override
    public void onFillRequest(FillRequest request, CancellationSignal cancellationSignal, FillCallback callback) {
        // 🛑 تله‌گذاری سراسری برای جلوگیری از کرش‌های روح در برنامه‌هایی مثل واتس‌اپ بیزینس
        try {
            Log.d(TAG, "🟢 Autofill Request Triggered!");

            AssistStructure structure = request.getFillContexts().get(request.getFillContexts().size() - 1).getStructure();
            String packageName = structure.getActivityComponent() != null ? structure.getActivityComponent().getPackageName() : "";

            // 🔴 حل قطعی مشکل سفیدی صفحه (بای‌پاس کردن ولت خودمان)
            if (packageName.equals("com.vns.vault")) {
                Log.d(TAG, "🚫 این اپلیکیشن خودمان است؛ برای جلوگیری از سفیدی صفحه آن را نادیده می‌گیریم.");
                callback.onSuccess(null);
                return;
            }

            usernameId = null;
            passwordId = null;

            int nodes = structure.getWindowNodeCount();
            for (int i = 0; i < nodes; i++) {
                traverseNode(structure.getWindowNodeAt(i).getRootViewNode());
            }

            if (usernameId == null && passwordId == null) {
                callback.onSuccess(null);
                return;
            }

            FillResponse.Builder responseBuilder = new FillResponse.Builder();
            boolean hasDataToAdd = false; // متغیر بررسی وضعیت جعبه

            // نصب سنسور هوشمند و تهاجمی برای اپلیکیشن‌های دیگر
            if (passwordId != null) {
                SaveInfo.Builder saveInfoBuilder = new SaveInfo.Builder(
                        SaveInfo.SAVE_DATA_TYPE_PASSWORD | SaveInfo.SAVE_DATA_TYPE_USERNAME,
                        new AutofillId[] { passwordId }
                );

                if (usernameId != null) {
                    saveInfoBuilder.setOptionalIds(new AutofillId[] { usernameId });
                }

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                    saveInfoBuilder.setFlags(SaveInfo.FLAG_SAVE_ON_ALL_VIEWS_INVISIBLE);
                }

                responseBuilder.setSaveInfo(saveInfoBuilder.build());
                hasDataToAdd = true;
                Log.d(TAG, "👁️ سنسور هوشمند Autosave روشن شد.");
            }

            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
            String itemsJsonString = prefs.getString("vns_autofill_active_data", null);

            // ⌨️ بررسی درخواست پشتیبانی کیبورد (Inline)
            android.view.inputmethod.InlineSuggestionsRequest inlineRequest = null;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                inlineRequest = request.getInlineSuggestionsRequest();
            }

            // =================================================================
            // بررسی وضعیت گاوصندوق (آیا برنامه بسته/قفل است؟)
            // =================================================================
            if (itemsJsonString == null || itemsJsonString.length() < 5) {
                Log.d(TAG, "🔒 گاوصندوق بسته است. درخواست احراز هویت را به صفحه می‌فرستیم.");

                RemoteViews presentation = new RemoteViews(getPackageName(), android.R.layout.simple_list_item_1);
                presentation.setTextViewText(android.R.id.text1, "🔒 Tap to unlock VNS vault");

                android.content.Intent authIntent = new android.content.Intent(this, com.vns.vault.AutofillAuthActivity.class);
                android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(
                        this,
                        1001,
                        authIntent,
                        android.app.PendingIntent.FLAG_CANCEL_CURRENT | android.app.PendingIntent.FLAG_MUTABLE
                );

                android.content.IntentSender intentSender = pendingIntent.getIntentSender();
                Dataset.Builder authDataset = new Dataset.Builder();

                // ⌨️ ساخت دکمه قفل برای نمایش روی نوار کیبورد
                android.service.autofill.InlinePresentation inlineAuth = null;
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R && inlineRequest != null && inlineRequest.getInlinePresentationSpecs().size() > 0) {
                    android.widget.inline.InlinePresentationSpec spec = inlineRequest.getInlinePresentationSpecs().get(0);
                    inlineAuth = new android.service.autofill.InlinePresentation(
                            androidx.autofill.inline.v1.InlineSuggestionUi.newContentBuilder(pendingIntent)
                                    .setTitle("🔒 Unlock VNS vault")
                                    .build().getSlice(),
                            spec, false);
                }

                if (usernameId != null) {
                    if (inlineAuth != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                        authDataset.setValue(usernameId, null, presentation, inlineAuth);
                    } else {
                        authDataset.setValue(usernameId, null, presentation);
                    }
                    authDataset.setAuthentication(intentSender);
                }
                if (passwordId != null) {
                    if (inlineAuth != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                        authDataset.setValue(passwordId, null, presentation, inlineAuth);
                    } else {
                        authDataset.setValue(passwordId, null, presentation);
                    }
                    authDataset.setAuthentication(intentSender);
                }

                responseBuilder.addDataset(authDataset.build());
                callback.onSuccess(responseBuilder.build());
                return;
            }
            // =================================================================

            try {
                JSONArray itemsArray = new JSONArray(itemsJsonString);
                String corePackage = packageName.toLowerCase();
                if (corePackage.split("\\.").length > 1) {
                    corePackage = corePackage.split("\\.")[1];
                }

                for (int i = 0; i < itemsArray.length(); i++) {
                    JSONObject item = itemsArray.getJSONObject(i);

                    String name = item.optString("name", "").toLowerCase();
                    String site = item.optString("site", "").toLowerCase();

                    boolean isMatch = false;
                    if (name.length() > 2 && (packageName.toLowerCase().contains(name) || name.contains(corePackage))) {
                        isMatch = true;
                    }
                    if (site.length() > 4 && site.contains(corePackage)) {
                        isMatch = true;
                    }

                    if (isMatch) {
                        String foundUsername = item.optString("user", "");
                        String foundPassword = item.optString("pass", "");
                        String foundTitle = item.optString("name", "Account");

                        if (foundUsername.isEmpty() && foundPassword.isEmpty()) continue;

                        RemoteViews presentationUser = new RemoteViews(getPackageName(), android.R.layout.simple_list_item_1);
                        presentationUser.setTextViewText(android.R.id.text1, "👤 " + foundTitle + " (" + foundUsername + ")");

                        RemoteViews presentationPass = new RemoteViews(getPackageName(), android.R.layout.simple_list_item_1);
                        presentationPass.setTextViewText(android.R.id.text1, "🔑 " + foundUsername + " (Password)");

                        // ⌨️ ساخت دکمه‌های اکانت برای نمایش روی کیبورد
                        android.service.autofill.InlinePresentation inlineUser = null;
                        android.service.autofill.InlinePresentation inlinePass = null;

                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R && inlineRequest != null && inlineRequest.getInlinePresentationSpecs().size() > 0) {
                            android.widget.inline.InlinePresentationSpec spec = inlineRequest.getInlinePresentationSpecs().get(0);
                            android.app.PendingIntent emptyIntent = android.app.PendingIntent.getActivity(this, 0, new android.content.Intent(), android.app.PendingIntent.FLAG_IMMUTABLE);

                            if (!foundUsername.isEmpty()) {
                                inlineUser = new android.service.autofill.InlinePresentation(
                                        androidx.autofill.inline.v1.InlineSuggestionUi.newContentBuilder(emptyIntent)
                                                .setTitle(foundUsername)
                                                .setSubtitle(foundTitle)
                                                .build().getSlice(),
                                        spec, false);
                            }
                            if (!foundPassword.isEmpty()) {
                                inlinePass = new android.service.autofill.InlinePresentation(
                                        androidx.autofill.inline.v1.InlineSuggestionUi.newContentBuilder(emptyIntent)
                                                .setTitle("Password for " + foundUsername)
                                                .setSubtitle("VNS vault")
                                                .build().getSlice(),
                                        spec, false);
                            }
                        }

                        Dataset.Builder datasetBuilder = new Dataset.Builder();
                        datasetBuilder.setId("vns_account_" + item.optString("id", String.valueOf(i)));

                        if (usernameId != null && !foundUsername.isEmpty()) {
                            if (inlineUser != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                                datasetBuilder.setValue(usernameId, AutofillValue.forText(foundUsername), presentationUser, inlineUser);
                            } else {
                                datasetBuilder.setValue(usernameId, AutofillValue.forText(foundUsername), presentationUser);
                            }
                        }
                        if (passwordId != null && !foundPassword.isEmpty()) {
                            if (inlinePass != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                                datasetBuilder.setValue(passwordId, AutofillValue.forText(foundPassword), presentationPass, inlinePass);
                            } else {
                                datasetBuilder.setValue(passwordId, AutofillValue.forText(foundPassword), presentationPass);
                            }
                        }

                        responseBuilder.addDataset(datasetBuilder.build());
                        hasDataToAdd = true;
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ خطا در پردازش JSON", e);
            }

            // 🛑 رفع باگ IllegalStateException:
            // بررسی می‌کنیم که آیا اصلاً اطلاعاتی برای ارسال (ساخت جعبه) وجود دارد یا خیر
            if (hasDataToAdd) {
                callback.onSuccess(responseBuilder.build());
            } else {
                Log.d(TAG, "⚠️ هیچ اطلاعاتی برای این فرم (مثل واتس‌اپ) یافت نشد. ارسال پاسخ تهی.");
                callback.onSuccess(null);
            }

        } catch (Exception e) {
            // 🚨 شکار کرش: اگر هر اتفاقی افتاد برنامه بسته نمی‌شود و فقط پیام به سیستم ارسال می‌شود
            Log.e("VaultAutofillBug", "❌ خطا در پردازش Autofill (احتمالاً فیلدهای ناشناخته): " + e.getMessage(), e);
            if (callback != null) {
                callback.onSuccess(null); // اعلام موفقیت خالی برای آرام کردن سیستم عامل
            }
        }
    }

    @Override
    public void onSaveRequest(SaveRequest request, SaveCallback callback) {
        // 🛑 تله‌گذاری برای ذخیره اطلاعات
        try {
            Log.d(TAG, "💾 درخواست ذخیره اطلاعات (Autosave) از طرف کاربر تایید شد!");

            AssistStructure structure = request.getFillContexts().get(request.getFillContexts().size() - 1).getStructure();
            String packageName = structure.getActivityComponent() != null ? structure.getActivityComponent().getPackageName() : "Unknown App";

            savedUsername = "";
            savedPassword = "";

            int nodes = structure.getWindowNodeCount();
            for (int i = 0; i < nodes; i++) {
                extractSavedData(structure.getWindowNodeAt(i).getRootViewNode());
            }

            if (!savedPassword.isEmpty()) {
                SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
                JSONObject pendingSave = new JSONObject();
                try {
                    pendingSave.put("user", savedUsername);
                    pendingSave.put("pass", savedPassword);
                    pendingSave.put("app", packageName);

                    prefs.edit().putString("vns_pending_save", pendingSave.toString()).apply();
                    Log.d(TAG, "✅ اکانتِ [" + savedUsername + "] در صندوق پستی قرار گرفت.");
                } catch (Exception e) {
                    Log.e(TAG, "❌ خطا در ذخیره صندوق پستی", e);
                }
            }

            callback.onSuccess();

        } catch (Exception e) {
            Log.e("VaultAutofillBug", "❌ خطا در پردازش Save: " + e.getMessage(), e);
            if (callback != null) {
                callback.onFailure(e.getMessage());
            }
        }
    }

    private void extractSavedData(ViewNode node) {
        if (node == null) return;

        String h = "";
        if (node.getAutofillHints() != null) {
            for (String hint : node.getAutofillHints()) {
                if (hint != null) {
                    h += hint.toLowerCase() + " ";
                }
            }
        }
        String viewId = node.getIdEntry() != null ? node.getIdEntry().toLowerCase() : "";
        String textHint = node.getHint() != null ? node.getHint().toString().toLowerCase() : "";
        String contentDesc = node.getContentDescription() != null ? node.getContentDescription().toString().toLowerCase() : "";

        String combinedData = h + " " + viewId + " " + textHint + " " + contentDesc;

        if (combinedData.contains("password") || combinedData.contains("pass") || combinedData.contains("رمز") || combinedData.contains("پسورد")) {
            if (node.getText() != null) {
                savedPassword = node.getText().toString();
            }
        } else if (combinedData.contains("username") || combinedData.contains("email") || combinedData.contains("user") || combinedData.contains("ایمیل") || combinedData.contains("کاربری")) {
            if (node.getText() != null) {
                savedUsername = node.getText().toString();
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            extractSavedData(node.getChildAt(i));
        }
    }

    private void traverseNode(ViewNode node) {
        if (node == null) return;

        if (node.getAutofillHints() != null) {
            for (String hint : node.getAutofillHints()) {
                if (hint != null) {
                    String h = hint.toLowerCase();
                    if (h.contains("password")) {
                        passwordId = node.getAutofillId();
                    } else if (h.contains("username") || h.contains("email") || h.contains("login")) {
                        usernameId = node.getAutofillId();
                    }
                }
            }
        }

        String viewId = node.getIdEntry() != null ? node.getIdEntry().toLowerCase() : "";
        String textHint = node.getHint() != null ? node.getHint().toString().toLowerCase() : "";
        String contentDesc = node.getContentDescription() != null ? node.getContentDescription().toString().toLowerCase() : "";

        String combinedData = viewId + " " + textHint + " " + contentDesc;

        if (passwordId == null && (combinedData.contains("password") || combinedData.contains("pass") || combinedData.contains("رمز") || combinedData.contains("پسورد"))) {
            if (node.getAutofillId() != null) {
                passwordId = node.getAutofillId();
            }
        }

        if (usernameId == null && (combinedData.contains("username") || combinedData.contains("email") || combinedData.contains("user") || combinedData.contains("ایمیل") || combinedData.contains("کاربری"))) {
            if (node.getAutofillId() != null) {
                usernameId = node.getAutofillId();
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            traverseNode(node.getChildAt(i));
        }
    }
}