<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use Illuminate\Http\Request;

class PetController extends Controller
{
    public function index()
    {
        $pets = auth()->user()->pets()->with('owner')->get();
        return response()->json($pets);
    }

public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'species' => 'required|string',
        'breed' => 'nullable|string',
        'birth_date' => 'nullable|date',
        'photo_url' => 'nullable|string',
        'weight' => 'nullable|numeric',
        'notes' => 'nullable|string',
    ]);

    // Автоматическая привязка питомца к текущему пользователю
    $pet = auth()->user()->pets()->create($validated);

    return response()->json($pet, 201);
}

    public function show(Pet $pet)
    {
        $this->authorize('view', $pet);
        return response()->json($pet->load('owner', 'shares'));
    }

    public function update(Request $request, Pet $pet)
    {
        $this->authorize('update', $pet);

        $pet->update($request->all());
        return response()->json($pet);
    }

    public function destroy(Pet $pet)
    {
        $this->authorize('delete', $pet);
        $pet->delete();
        return response()->json(null, 204);
    }
}