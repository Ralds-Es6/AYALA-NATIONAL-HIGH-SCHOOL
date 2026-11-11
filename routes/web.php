<?php

use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application.
| All unmatched web routes fallback to the SpaController to support
| client-side routing via React.
|
*/

Route::get('/{any?}', [SpaController::class, 'index'])
    ->where('any', '^(?!api|up).*$')
    ->name('spa');
