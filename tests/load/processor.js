"use strict";

// Real animal IDs from the database — fetched on 2026-04-05.
// Update this pool if the seed data changes.
const ANIMAL_ID_POOL = [24, 22, 21, 20, 17, 16, 15, 14, 7, 2, 3, 9, 8, 4, 6, 10, 5];

// Spanish values matching the server's validation enums (validation.js).
// English values are silently dropped by the filter middleware, causing all
// requests to hit Supabase with no filter and increasing pool pressure.
const SPECIES_OPTIONS = ["perro", "gato", ""];
const STATUS_OPTIONS = ["disponible", "adoptado", "pendiente", "en hogar temporal", ""];
const LIMIT_OPTIONS = [10, 20, 50];
const OFFSET_OPTIONS = [0, 0, 0, 10]; // weighted toward 0

/**
 * beforeScenario hook for "Single Animal" scenario.
 * Picks a random animal ID from the known pool and sets it on context.
 */
function setAnimalId(context, events, done) {
  const id = ANIMAL_ID_POOL[Math.floor(Math.random() * ANIMAL_ID_POOL.length)];
  context.vars.animalId = id;
  return done();
}

/**
 * beforeScenario hook for "List Animals" scenario.
 * Randomizes query parameters to exercise different filter/sort code paths
 * and avoid query-result caching artifacts.
 */
function generateQueryVariations(context, events, done) {
  context.vars.species = SPECIES_OPTIONS[Math.floor(Math.random() * SPECIES_OPTIONS.length)];
  context.vars.animalStatus = STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)];
  context.vars.limit = LIMIT_OPTIONS[Math.floor(Math.random() * LIMIT_OPTIONS.length)];
  context.vars.offset = OFFSET_OPTIONS[Math.floor(Math.random() * OFFSET_OPTIONS.length)];
  return done();
}

module.exports = { setAnimalId, generateQueryVariations };
