<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiChatService
{
    //answers a free text question from an employee, returns a string answer
    public static function ask(string $question): ?string
    {
        $systemPrompt = "You are a helpful IT support assistant for a company help desk."
            ."Answer the employee's question with practical troubleshooting steps when relevant."
            ."Keep answers concise (a few sentences or a short numbered list)."
            ."If the question isn't related to IT/technical support, politely say you can only help with IT-related questions.";

        try{
            $response = Http::withToken(config('services.openai.key'))
                ->timeout(15)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $question],
                    ],
                    'temperature' => 0.3,
                ]);
            \Log::info('AI chat status: ' . $response->status());
            if(! $response->successful()) {
                return null;
            }

            $answer = $response->json('choices.0.message.content');

            return $answer ? trim($answer) : null;
        } catch(\Exception $e){
            \Log::info('AI chat exception: ' . $e->getMessage());
            return null;
        }
    }
}