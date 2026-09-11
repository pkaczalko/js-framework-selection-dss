import prisma from '../../prisma/prisma-client';

const getTags = async (username?: string): Promise<string[]> => {
  const tags = await prisma.tag.groupBy({
    where: username
      ? {
          articles: {
            some: {
              author: {
                username: {
                  equals: username,
                },
              },
            },
          },
        }
      : undefined,
    by: ['name'],
    orderBy: {
      _count: {
        name: 'desc',
      },
    },
    take: 10,
  });

  return tags.map(tag => tag.name);
};

export default getTags;
