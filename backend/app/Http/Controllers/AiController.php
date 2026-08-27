<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AiTicketAnalysisService;
use App\Services\AiChatService;

class AiController extends Controller
{
    //called while the employee is filling the create ticket form
    //returns a suggested category and priority
    public function suggestCategoryPriority(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
        ]);

        $suggestion = AiTicketAnalysisService::suggest($request->title, $request->description);

        return response()->json([
            'category' => $suggestion['category'] ?? null,
            'priority' => $suggestion['priority'] ?? null,
        ]);
    }

    //employee--chatcbot: answering text questions
    public function chat(Request $request)
    {
        $request->validate([
            'question' => 'required|string|max:1000',
        ]);

        $answer = AiChatService::ask($request->question);

        return response()->json([
            'answer' => $answer ?? "Sorry, I couldn't get an answer right now. Please try again or contact IT support directly. ",
        ]);
    }
}