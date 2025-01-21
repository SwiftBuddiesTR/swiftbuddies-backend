import process from 'node:process';

export function loop(str: string): () => void {
  const twirlTimer = (function (_str) {
    const P = ['\\', '|', '/', '-'];
    let x = 0;
    return setInterval(function () {
      process.stdout.write('\r' + P[x++] + ' ' + _str);
      x &= 3;
    }, 250);
  })(str);

  return () => {
    clearInterval(twirlTimer);
    process.stdout.write('\r✓ ' + str);
    console.log('');
  };
}
