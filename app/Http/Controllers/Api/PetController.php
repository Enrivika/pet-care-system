<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

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
            'name' => 'required|string|max:255',
            'species' => 'nullable|string',
            'breed' => 'nullable|string',
            'age' => 'nullable|integer|min:0|max:200',
            'photo' => 'nullable|image|max:2048',
            'weight' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $birthDate = null;
        if ($request->filled('age')) {
            $birthDate = Carbon::now()->subYears($request->age)->format('Y-m-d');
        }
        
        $photoUrl = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('pets', 'public');
            $photoUrl = Storage::url($path);
        }

        $pet = auth()->user()->pets()->create([
            'name' => $validated['name'],
            'species' => $validated['species'] ?? 'other',
            'breed' => $validated['breed'] ?? null,
            'birth_date' => $birthDate,
            'photo_url' => $photoUrl,
            'weight' => $validated['weight'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

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

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'age' => 'nullable|integer|min:0|max:200',
            'photo' => 'nullable|image|max:2048',
        ]);

        $data = [];

        // Имя
        if ($request->filled('name')) {
            $data['name'] = $request->name;
        }

        // Возраст → birth_date
        if ($request->filled('age')) {
            $data['birth_date'] = Carbon::now()->subYears($request->age)->format('Y-m-d');
        }

        // Фото
        if ($request->hasFile('photo')) {
            // Удаляем старое фото
            if ($pet->photo_url) {
                $oldPath = str_replace('/storage/', '', $pet->photo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('photo')->store('pets', 'public');
            $data['photo_url'] = Storage::url($path);
        }

        $pet->update($data);

        return response()->json($pet);
    }

    public function destroy(Pet $pet)
    {
        $this->authorize('delete', $pet);
        $pet->delete();
        return response()->json(null, 204);
    }
}