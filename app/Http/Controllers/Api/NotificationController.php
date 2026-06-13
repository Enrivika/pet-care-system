<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Получить все уведомления пользователя
    public function index()
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->with('event:id,event_type')
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $notifications->map(function ($n) {
            $arr = $n->toArray();
            $arr['category'] = $n->event?->event_type;
            unset($arr['event']);
            return $arr;
        });

        return response()->json($data);
    }

    // Отметить уведомление как прочитанное
    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Уведомление прочитано']);
    }

    // Пометить все как прочитанные
    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Все уведомления прочитаны']);
    }

    // Удалить все уведомления
    public function clearAll()
    {
        Notification::where('user_id', auth()->id())->delete();

        return response()->json(['message' => 'История уведомлений очищена']);
    }

    // Удалить одно уведомление
    public function destroy($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Уведомление удалено']);
    }
}