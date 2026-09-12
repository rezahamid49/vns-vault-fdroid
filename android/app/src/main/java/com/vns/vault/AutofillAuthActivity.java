package com.vns.vault;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

public class AutofillAuthActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d("VNS_AUTOFILL_LOG", "⚡ کاربر روی دکمه قفل کلیک کرد. در حال بیدار کردن ولت...");

        // ساخت یک تونل مستقیم به سمت برنامه اصلی ولت برای رمزگشایی اطلاعات
        Intent wakeUpIntent = new Intent(this, MainActivity.class);

        // این فلگ‌ها به اندروید می‌گویند که برنامه را با بالاترین سرعت و در یک تب جدید باز کن
        wakeUpIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        startActivity(wakeUpIntent);

        // به محض پرتاب کردن کاربر به داخل ولت، این صفحه واسطِ نامرئی خودش را می‌بندد
        finish();
    }
}