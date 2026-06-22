// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');

const hash = '$2b$12$bk9gRGZJhxOdSj2BaWAJq.8wXn2TAhwFCcCmT/ld65GKYc9wum2H.';
bcrypt.compare('StrongPass123!', hash).then((result: boolean) => {
  console.log('Password match:', result);
  const newHash = bcrypt.hashSync('StrongPass123!', 12);
  console.log('New hash:', newHash);
  bcrypt.compare('StrongPass123!', newHash).then((r2: boolean) => {
    console.log('New hash match:', r2);
  });
});
