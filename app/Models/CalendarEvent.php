<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEvent extends Model
{
    protected $fillable = [
        'pet_id', 'created_by', 'title', 'event_type', 'start_at', 'end_at',
        'is_recurring', 'recurrence_rule', 'reminder_minutes', 'is_completed',
        'completed_at', 'notes', 'is_medical', 'is_all_day', 'reminder_sent_at'
    ];

    protected $casts = [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'reminder_minutes' => 'integer',
            'reminder_sent_at' => 'datetime',
            'is_recurring' => 'boolean',
            'is_completed' => 'boolean',
            'is_medical' => 'boolean',
            'is_all_day' => 'boolean',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scope для будущих уведомлений (задачи, у которых пришло время напомнить)
    public function scopeNeedsReminder($query)
    {
        return $query->whereNotNull('reminder_minutes')
            ->whereNull('reminder_sent_at')
            ->where('start_at', '>', now());
    }

    public static function existsForPetAndDate(int $petId, string $eventType, $startAt): bool
    {
        return self::where('pet_id', $petId)
            ->where('event_type', $eventType)
            ->where('start_at', $startAt)
            ->exists();
    }

    /**
     * Вычисляет следующую дату старта на основе правила повторения.
     * Централизованная логика (раньше дублировалась в контроллере и команде).
     */
    public static function calculateNextStart(\Carbon\Carbon $from, ?string $rule): ?\Carbon\Carbon
    {
        if (!$rule || $rule === 'none') {
            return null;
        }

        $base = $from->copy();

        return match ($rule) {
            'daily', 'Ежедневно'      => $base->addDay(),
            'weekdays', 'По будням'   => self::nextWeekday($base),
            'weekends', 'По выходным' => self::nextWeekend($base),
            'weekly', 'Еженедельно'   => $base->addWeek(),
            'monthly', 'Ежемесячно'   => $base->addMonth(),
            'yearly', 'Ежегодно'      => $base->addYear(),
            default                   => null,
        };
    }

    private static function nextWeekday(\Carbon\Carbon $date): \Carbon\Carbon
    {
        $next = $date->copy()->addDay();
        while ($next->isWeekend()) {
            $next->addDay();
        }
        return $next;
    }

    private static function nextWeekend(\Carbon\Carbon $date): \Carbon\Carbon
    {
        $next = $date->copy()->addDay();
        while (!$next->isWeekend()) {
            $next->addDay();
        }
        return $next;
    }

    /**
     * Создаёт и сохраняет следующее повторение задачи (если повтор включён).
     * Возвращает созданное событие или null (если повтор не нужен или уже существует).
     *
     * Используется и из complete() контроллера, и из команды MarkOverdueTasksAsCompleted.
     */
    public function createNextOccurrence(): ?self
    {
        if (!$this->is_recurring || !$this->recurrence_rule || $this->recurrence_rule === 'none') {
            return null;
        }

        $nextStart = self::calculateNextStart($this->start_at, $this->recurrence_rule);
        if (!$nextStart) {
            return null;
        }

        // Защита от дубликатов
        if (self::existsForPetAndDate($this->pet_id, $this->event_type, $nextStart)) {
            return null;
        }
        
        $child = $this->replicate([
            'id', 'created_at', 'updated_at', 'completed_at', 'reminder_sent_at'
        ]);

        $child->start_at         = $nextStart;
        $child->is_completed     = false;
        $child->completed_at     = null;
        $child->notes            = null;
        $child->reminder_sent_at = null;        

        // Важно: для all-day задач принудительно ставим end_at = следующий день 00:00,        
        if ($child->is_all_day) {
            $child->normalizeAllDayEndAt();
        } else {
            $durationMinutes = $this->end_at
                ? $this->start_at->diffInMinutes($this->end_at)
                : 60;
            $child->end_at = $nextStart->copy()->addMinutes($durationMinutes);
        }

        $child->save();

        return $child;
    }
    
    public function normalizeAllDayEndAt(): void
    {
        if (!$this->is_all_day || !$this->start_at) {
            return;
        }

        $this->end_at = \Carbon\Carbon::parse($this->start_at)
            ->startOfDay()
            ->addDay();
    }
   
    public function getDurationInMinutes(): int
    {
        if ($this->end_at) {
            return (int) $this->start_at->diffInMinutes($this->end_at);
        }

        return 60;
    }
}