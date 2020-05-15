// const observer = new MutationObserver((mutations) => {
//   mutations.forEach((mutation) => {
//     if (mutation.addedNodes && mutation.addedNodes.length > 0) {
//       // This DOM change was new nodes being added. Run our substitution
//       // algorithm on each newly added node.
//       for (let i = 0; i < mutation.addedNodes.length; i++) {
//         const newNode = mutation.addedNodes[i];
//         replaceText(newNode);
//       }
//     }
//   });
// });

// observer.observe(document.body, {
//   childList: true,
//   subtree: true
// });

// // Start the recursion from the body tag.
// replaceText(document.body);

export {};
