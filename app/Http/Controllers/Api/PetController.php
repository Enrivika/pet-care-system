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
            'photo' => 'nullable|image|max:5120',
            'weight' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $birthDate = null;
        if ($request->filled('age')) {
            $birthDate = Carbon::now()->subYears($request->age)->format('Y-m-d');
        }
        
        $photoUrl = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . $file->getClientOriginalName();
                        
            $petsPath = public_path('images_pets');
            if (!file_exists($petsPath)) {
                mkdir($petsPath, 0755, true);
            }
            
            $file->move($petsPath, $filename);
            $photoUrl = '/images_pets/' . $filename;
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
            'photo' => 'nullable|image|max:5120',
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
            if ($pet->photo_url) {
                // Поддерживаем старые пути: оригинальный /pets/ и промежуточный /petsimages/
                // Всегда маппим на текущую папку images_pets при удалении старого файла
                $oldRelative = null;
                if (str_starts_with($pet->photo_url, '/pets/')) {
                    $oldRelative = str_replace('/pets/', 'images_pets/', $pet->photo_url);
                } elseif (str_starts_with($pet->photo_url, '/petsimages/')) {
                    $oldRelative = str_replace('/petsimages/', 'images_pets/', $pet->photo_url);
                } elseif (str_starts_with($pet->photo_url, '/images_pets/')) {
                    $oldRelative = str_replace('/images_pets/', 'images_pets/', $pet->photo_url);
                }

                if ($oldRelative) {
                    $oldPath = public_path($oldRelative);
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }
            }
            
            $file = $request->file('photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            
            $petsPath = public_path('images_pets');
            if (!file_exists($petsPath)) {
                mkdir($petsPath, 0755, true);
            }
            
            $file->move($petsPath, $filename);
            $data['photo_url'] = '/images_pets/' . $filename;
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