import { type Env, handleContact } from './contact';

export default {
  fetch: (request: Request, env: Env) => handleContact(request, env),
};
