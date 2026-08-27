<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use  Illuminate\Support\Facades\Validator;

class AttachmentController extends Controller
{
    //upload an attachment to a ticket; employee and admin can attach on the ticket
    //when agents want to attach they use the comments

    public function storeForTicket(Request $request, $id)
    {
        $user = Auth::guard('api')->user();
        $role = $user->role->name;
        $ticket = Ticket::with('status')->findOrFail($id);

        if(! in_array($role, ['Employee', 'Admin'], true)){
            return response()->json(['error' => 'Only the ticket\'s Employee or an Admin may attach files to a ticket.'], 403);
        }

        if($role === 'Employee' && $ticket->employee_id !== $user->id){
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if($ticket->status->name === 'Closed'){
            return response()->json(['error' => 'This ticket is closed and can no longer accept attachments.'], 403);
        }

        //check file type and size
        $validator = Validator::make($request->all(), [
            'file' => 'bail|required|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip',
        ], [
            'file.mimes' => 'This file type is not supported. Allowed types: jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt, zip',
            'file.max' => 'File is too large. Maximum size is 10MB',
        ]);
        
        if($validator->fails()){
            return response()->json($validator->errors(), 422);
        }

        $file = $request->file('file');
        $path = $file->store('attachments', 'public');

        $attachment = Attachment::create([
            'ticket_id' => $ticket->id,
            'uploaded_by' => $user->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json($attachment, 201);
    }

    //delete an attachment(admin or the person who attaches it)
    public function destroy($id)
    {
        $user = Auth::guard('api')->user();
        $attachment = Attachment::with('ticket.status')->findOrFail($id);
        $role = $user->role->name;

        $isUploader = $attachment->uploaded_by === $user->id;
        $isAdmin = $role === 'Admin';

        if(! $isUploader && ! $isAdmin){
            return response()->json(['error' => 'This ticket is closed and its attachments can no longer be modified'], 403);
        }

        \Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted']);
    }
}