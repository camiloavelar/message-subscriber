export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve();
    }, ms);
  });
}