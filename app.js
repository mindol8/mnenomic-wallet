import express from 'express';
import walletRouter from './routes/wallet/index.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/wallet', walletRouter);

app.set('port', port);
app.listen(app.get('port'), () => {
  console.log(`app is listening in http://localhost:${app.get('port')}`);
});

