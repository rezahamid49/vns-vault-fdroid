package com.vns.vault;

import androidx.annotation.RequiresApi;
import android.credentials.ClearCredentialStateException;
import android.credentials.CreateCredentialException;
import android.credentials.GetCredentialException;
import android.os.CancellationSignal;
import android.os.OutcomeReceiver;
import android.service.credentials.BeginCreateCredentialRequest;
import android.service.credentials.BeginCreateCredentialResponse;
import android.service.credentials.BeginGetCredentialRequest;
import android.service.credentials.BeginGetCredentialResponse;
import android.service.credentials.ClearCredentialStateRequest;
import android.service.credentials.CredentialProviderService;

import androidx.annotation.NonNull;

@RequiresApi(api = 34)
public class VnsCredentialProviderService extends CredentialProviderService {

    @Override
    public void onBeginCreateCredential(@NonNull BeginCreateCredentialRequest beginCreateCredentialRequest, @NonNull CancellationSignal cancellationSignal, @NonNull OutcomeReceiver<BeginCreateCredentialResponse, CreateCredentialException> outcomeReceiver) {
        // جلوگیری از کرش هنگام درخواست ذخیره رمز جدید
        outcomeReceiver.onResult(new BeginCreateCredentialResponse.Builder().build());
    }

    @Override
    public void onBeginGetCredential(@NonNull BeginGetCredentialRequest beginGetCredentialRequest, @NonNull CancellationSignal cancellationSignal, @NonNull OutcomeReceiver<BeginGetCredentialResponse, GetCredentialException> outcomeReceiver) {
        // جلوگیری از کرش هنگام درخواست واکشی (خواندن) رمزها
        outcomeReceiver.onResult(new BeginGetCredentialResponse.Builder().build());
    }

    @Override
    public void onClearCredentialState(@NonNull ClearCredentialStateRequest clearCredentialStateRequest, @NonNull CancellationSignal cancellationSignal, @NonNull OutcomeReceiver<Void, ClearCredentialStateException> outcomeReceiver) {
        // پاسخ موفقیت‌آمیز به درخواست پاکسازی سشن‌ها
        outcomeReceiver.onResult(null);
    }
}