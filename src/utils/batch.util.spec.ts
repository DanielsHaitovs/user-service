import { batch } from '@/utils/batch.util';

describe('batch Utility - Input Validation Guards', () => {
  it('should throw an explicit error if the requested batch size is zero', () => {
    expect(() => {
      batch([1, 2, 3], 0);
    }).toThrow('Batch size must be greater than 0');
  });

  it('should throw an explicit error if the requested batch size is a negative number', () => {
    expect(() => {
      batch([1, 2, 3], -5);
    }).toThrow('Batch size must be greater than 0');
  });

  it('should return a clean empty array if the input array collection is completely empty', () => {
    const result = batch([], 10);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});

describe('batch Utility - Chunk Partitioning Logic', () => {
  it('should partition an array into perfectly equal sizes when the total length is perfectly divisible', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    const result = batch(items, 2);

    expect(result).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ]);
    expect(result.length).toBe(3);
  });

  it('should create an asymmetric trailing chunk for leftover elements when the collection is not perfectly divisible', () => {
    const items = [1, 2, 3, 4, 5];
    const result = batch(items, 2);

    expect(result).toEqual([[1, 2], [3, 4], [5]]);
    expect(result.length).toBe(3);
  });

  it('should return a single batch containing all original items if the batch size exceeds the array length', () => {
    const items = [true, false, true];
    const result = batch(items, 100);

    expect(result).toEqual([[true, false, true]]);
    expect(result.length).toBe(1);
  });
});

describe('batch Utility - Generics and Object Integrity', () => {
  it('should retain object references accurately across multi-type structures without altering internal fields', () => {
    const obj1 = { id: 'usr-1', role: 'admin' };
    const obj2 = { id: 'usr-2', role: 'member' };
    const obj3 = { id: 'usr-3', role: 'guest' };

    const usersCollection = [obj1, obj2, obj3];
    const result = batch(usersCollection, 2);

    expect(result).toEqual([[obj1, obj2], [obj3]]);

    expect(result[0]?.[0]).toBe(obj1);
    expect(result[1]?.[0]).toBe(obj3);
  });
});
