<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Category;
use App\Models\Priority;

class AiTicketAnalysisService
{
    // Sends the ticket title to OpenAI and asks it to pick a category
    // and priority from the ones that actually exist in the DB. Returns null on
    // any failure so ticket creation never breaks because of the AI being down.
    public static function suggest(string $title, string $description): ?array
    {
        $categoryNames = Category::pluck('name')->toArray();
        $priorityNames = Priority::pluck('name')->toArray();

        $prompt = "You are an IT help desk assistant. Given a ticket title and description, "
            . "pick the single best category and priority that describes the ticket.\n\n"
            . "Allowed categories: " . implode(', ', $categoryNames) . "\n"
            . "Allowed priorities: " . implode(', ', $priorityNames) . "\n\n"
            . "Title: {$title}\n"
            . "Description: {$description}\n\n"
            . "Respond ONLY with JSON in the exact shape, no other text: "
            . '{"category": "...", "priority": "..."}';

        try {
            $response = Http::withToken(config('services.openai.key'))
                ->timeout(10)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0,
                ]);

            \Log::info('OpenAI status: ' . $response->status());
            \Log::info('OpenAI raw body: ' . $response->body());

            if (! $response->successful()) {
                return null;
            }

            $content = $response->json('choices.0.message.content');

            \Log::info('OpenAI extracted content: ' . $content);

            $content = trim($content);
            $content = preg_replace('/^```json\s*|\s*```$/', '', $content);

            $parsed = json_decode($content, true);

            \Log::info('OpenAI parsed: ' . json_encode($parsed));

            if (! isset($parsed['category']) || ! isset($parsed['priority'])) {
                return null;
            }

            if (! in_array($parsed['category'], $categoryNames) || ! in_array($parsed['priority'], $priorityNames)) {
                \Log::info('Category/priority mismatch. Categories in DB: ' . implode(',', $categoryNames) . ' | Priorities in DB: ' . implode(',', $priorityNames));
                return null;
            }

            return $parsed;

        } catch (\Exception $e) {
            \Log::info('OpenAI exception: ' . $e->getMessage());
            return null;
        }
    }
}