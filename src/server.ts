import { env } from "./config/env";

import app from "./app";

const PORT = env.PORT;

const bootstrap = async () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

bootstrap();
