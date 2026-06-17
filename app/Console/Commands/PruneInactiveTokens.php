<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

class PruneInactiveTokens extends Command
{
    protected $signature = 'tokens:prune-inactive';

    protected $description = 'Удаление токенов, не использовавшихся более заданного срока';

    public function handle(): int
    {
        $inactivityMonths = (int) config('sanctum.inactivity_months', 3);
        $threshold = now()->subMonths($inactivityMonths);

        $deleted = PersonalAccessToken::query()
            ->where(function ($query) use ($threshold) {
                $query->where('last_used_at', '<', $threshold)
                    ->orWhere(function ($query) use ($threshold) {
                        $query->whereNull('last_used_at')
                            ->where('created_at', '<', $threshold);
                    });
            })
            ->delete();

        $this->info("Удалено неактивных токенов: {$deleted}");

        return self::SUCCESS;
    }
}