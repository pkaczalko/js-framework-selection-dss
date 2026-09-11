
const API = process.env.API_URL || 'http://localhost:3000/api';
const API_ORIGIN = API.replace(/\/api\/?$/, '');
const AVATAR = `${API_ORIGIN}/images/smiley-cyrus.jpeg`;
const COUNT = 1000;
const USER = {
  username: 'measure',
  email: 'measure@local.test',
  password: 'measurepass',
};

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { res, body };
}

async function registerOrLogin() {
  const { res, body } = await request('/users', {
    method: 'POST',
    body: JSON.stringify({ user: USER }),
  });
  if (res.ok && body?.user?.token) {
    return body.user.token;
  }

  const login = await request('/users/login', {
    method: 'POST',
    body: JSON.stringify({
      user: { email: USER.email, password: USER.password },
    }),
  });
  if (!login.res.ok || !login.body?.user?.token) {
    throw new Error(
      `Nie udało się zalogować użytkownika measure (${login.res.status}): ${JSON.stringify(login.body)}`,
    );
  }
  return login.body.user.token;
}

async function ensureAvatar(token) {
  const { res, body } = await request('/user', {
    method: 'PUT',
    headers: { Authorization: `Token ${token}` },
    body: JSON.stringify({ user: { image: AVATAR } }),
  });
  if (!res.ok || body?.user?.image !== AVATAR) {
    throw new Error(
      `PUT /user image failed (${res.status}): ${JSON.stringify(body)}`,
    );
  }
  console.log(`avatar ${AVATAR}`);
}

async function existingMeasureTitles(token) {
  const titles = new Set();
  let offset = 0;
  const limit = 100;
  for (;;) {
    const { res, body } = await request(
      `/articles?author=${USER.username}&limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Token ${token}` } },
    );
    if (!res.ok) {
      throw new Error(`GET /articles failed: ${res.status} ${JSON.stringify(body)}`);
    }
    for (const article of body.articles || []) {
      titles.add(article.title);
    }
    offset += limit;
    if (!body.articles?.length || offset >= body.articlesCount) {
      break;
    }
  }
  return titles;
}

async function createArticle(token, index) {
  const n = String(index).padStart(2, '0');
  const title = `Measure article ${n}`;
  const { res, body } = await request('/articles', {
    method: 'POST',
    headers: { Authorization: `Token ${token}` },
    body: JSON.stringify({
      article: {
        title,
        description: `Measurement fixture ${n}`,
        body: `# ${title}\n\nDeterministic Markdown body for memory/TBT protocol.`,
        tagList: ['measure'],
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`POST /articles ${title} failed (${res.status}): ${JSON.stringify(body)}`);
  }
}

async function verify() {
  const { res, body } = await request(`/articles?limit=${COUNT}&offset=0`);
  if (!res.ok) {
    throw new Error(`Verify GET /articles failed: ${res.status}`);
  }
  const n = body.articles?.length ?? 0;
  const total = body.articlesCount ?? 0;
  if (n !== COUNT) {
    throw new Error(
      `Oczekiwano ${COUNT} artykułów w odpowiedzi limit=${COUNT}, jest ${n} (articlesCount=${total})`,
    );
  }
  const missingImage = (body.articles || []).filter((a) => a.author?.image !== AVATAR);
  if (missingImage.length) {
    throw new Error(
      `Oczekiwano avataru ${AVATAR}, brak u ${missingImage.length} artykułów (np. ${missingImage[0]?.title})`,
    );
  }
  console.log(`OK: GET /articles?limit=${COUNT} → ${n} artykułów (articlesCount=${total})`);
}

async function main() {
  console.log(`API: ${API}`);
  const token = await registerOrLogin();
  await ensureAvatar(token);
  const existing = await existingMeasureTitles(token);
  for (let i = 1; i <= COUNT; i += 1) {
    const title = `Measure article ${String(i).padStart(2, '0')}`;
    if (existing.has(title)) {
      console.log(`skip ${title}`);
      continue;
    }
    await createArticle(token, i);
    console.log(`created ${title}`);
  }
  await verify();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
