<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use NotificationChannels\WebPush\PushSubscription;

class PushSubscriptionController extends Controller
{
    public function subscribe(Request $request)
    {
        $this->validate($request, [
            'endpoint' => 'required|url',
            'keys' => 'required|array',
            'keys.p256dh' => 'required',
            'keys.auth' => 'required',
        ]);

        $user = $request->user();
        
        $user->updatePushSubscription(
            $request->endpoint,
            $request->keys['p256dh'],
            $request->keys['auth']
        );

        return response()->json(['message' => 'Подписка успешно создана']);
    }

    public function unsubscribe(Request $request)
    {
        $this->validate($request, [
            'endpoint' => 'required|url',
        ]);

        $user = $request->user();
        
        $user->deletePushSubscription($request->endpoint);

        return response()->json(['message' => 'Подписка удалена']);
    }
}