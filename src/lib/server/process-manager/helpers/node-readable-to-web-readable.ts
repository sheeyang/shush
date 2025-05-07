// // TODO: not in use
// import 'server-only';

// import { Readable } from 'stream';

// export function nodeReadableToWebReadable(nodeStream: Readable) {
//   const reader = nodeStream[Symbol.asyncIterator]();

//   return new ReadableStream({
//     async pull(controller) {
//       const { value, done } = await reader.next();
//       if (done) {
//         controller.close();
//       } else {
//         controller.enqueue(value);
//       }
//     },
//     cancel() {
//       if (nodeStream.destroy) nodeStream.destroy();
//     },
//   });
// }
