import { describe, it, expect } from 'vitest';
import { slugify } from '../../../server/utils/slugify.js';

describe('slugify', () => {
  it('devrait convertir en minuscules', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
    expect(slugify('Test Case')).toBe('test-case');
  });

  it('devrait remplacer les espaces par des tirets', () => {
    expect(slugify('hello world')).toBe('hello-world');
    expect(slugify('multiple   spaces')).toBe('multiple-spaces');
  });

  it('devrait supprimer les accents', () => {
    expect(slugify('café')).toBe('cafe');
    expect(slugify('àéèêëïîôùû')).toBe('aeeeeiiouu');
    expect(slugify('José García')).toBe('jose-garcia');
    expect(slugify('Málaga Cádiz')).toBe('malaga-cadiz');
  });

  it('devrait remplacer les caractères spéciaux par des tirets', () => {
    expect(slugify('hello@world')).toBe('hello-world');
    expect(slugify('test&test')).toBe('test-test');
    expect(slugify('foo!bar?baz')).toBe('foo-bar-baz');
  });

  it('devrait supprimer les tirets en début et fin', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
    expect(slugify('---test---')).toBe('test');
  });

  it('devrait gérer les chaînes vides', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('devrait gérer les caractères Unicode', () => {
    expect(slugify('Andalucía Fotógrafo')).toBe('andalucia-fotografo');
    expect(slugify('Cabo de Gata')).toBe('cabo-de-gata');
  });

  it('devrait gérer les nombres', () => {
    expect(slugify('test 123')).toBe('test-123');
    expect(slugify('2024 Collection')).toBe('2024-collection');
  });

  it('devrait gérer les tirets multiples', () => {
    expect(slugify('hello---world')).toBe('hello-world');
    expect(slugify('test  -  test')).toBe('test-test');
  });

  it('devrait trim les espaces', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('devrait gérer des cas réels de collections', () => {
    expect(slugify('Cabo de Gata - Almería')).toBe('cabo-de-gata-almeria');
    expect(slugify('Fotografía Nocturna')).toBe('fotografia-nocturna');
    expect(slugify('Paisajes de Andalucía')).toBe('paisajes-de-andalucia');
  });

  it('devrait être idempotent', () => {
    const text = 'Hello World';
    const slug = slugify(text);
    expect(slugify(slug)).toBe(slug);
  });
});
