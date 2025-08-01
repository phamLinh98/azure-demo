const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // n
// 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
// 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
// const n = arr.length + 1; // n + 1
// function findMissing(arr) {
//   for (let i = 0; i < n; i++) {
//     if (arr[i] !== i + 1) {
//       return i + 1;
//     }
//   }
// }

// function findMissing(arr) {
//   for (let index = 0; index < n; index++) {
//     if (arr[index] - index != 1) {
//       return index + 1;
//     }
//   }
// }

function findMissing(_arr, index = 0) {
    return _arr[index] !== index + 1 ? index + 1: findMissing(_arr, index + 1);
}

console.log(findMissing(arr));

