<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\PetShare;
use App\Models\User;
use Illuminate\Http\Request;

class PetShareController extends Controller
{
    public function index(Pet $pet)
    {
        $this->authorize('view', $pet);
        
        return response()->json(
            $pet->shares()->with('user')->get()
        );
    }

    public function store(Request $request, Pet $pet)
    {
        // Проверка прав через политику доступа
        $this->authorize('update', $pet);

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:editor,viewer',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Нельзя пригласить самого себя'], 422);
        }

        $share = PetShare::create([
            'pet_id' => $pet->id,
            'user_id' => $user->id,
            'role' => $validated['role'],
            'invited_at' => now(),
        ]);

        return response()->json($share->load('user'), 201);
    }

    public function update(Request $request, PetShare $petShare)
    {
        $this->authorize('update', $petShare->pet);

        $validated = $request->validate([
            'role' => 'required|in:editor,viewer',
        ]);

        $petShare->update($validated);

        return response()->json($petShare->load('user'));
    }

    public function destroy(PetShare $petShare)
    {
        $this->authorize('update', $petShare->pet);

        $petShare->delete();

        return response()->json(null, 204);
    }
}