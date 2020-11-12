function makeTestBookmarks() {
  return [
    {
      id: 1,
      title: "Google",
      url: "https:\\www.google.com",
      description: "#1 search engine",
      rating: 5,
    },
    {
      id: 2,
      title: "Thinkful",
      url: "https:\\www.thinkful.com",
      description: "online bootcamp",
      rating: 5,
    },
    {
      id: 3,
      title: "Tim Hanke Portfolio",
      url: "https:\\portfolio.timhanke.dev",
      description: "#1 portfolio",
      rating: 5,
    },
    {
      id: 4,
      title: "Duck Duck Go",
      url: "https:\\www.duckduckgo.com",
      description: "#1 non-tracking search engine",
      rating: 5,
    },
    {
      id: 5,
      title: "Repl.it",
      url: "https:\\repl.it",
      description: "coding playground",
      rating: 5,
    },
    {
      id: 6,
      title: "Regex 101",
      url: "https:\\regex101.com",
      description: "online regex tester",
      rating: 5,
    },
    {
      id: 7,
      title: "typing.io",
      url: "https:\\typing.io",
      description: "typing practice for porgrammers",
      rating: 5,
    },
    {
      id: 8,
      title: "HackerRank",
      url: "https:\\www.hackerrank.com",
      description: "coding and algorithm challenges",
      rating: 5,
    },
    {
      id: 9,
      title: "Pramp",
      url: "https:\\www.pramp.com",
      description: "mock interviews and coding problems",
      rating: 5,
    },
    {
      id: 10,
      title: "VisuAlgo",
      url: "https:\\visualgo.net",
      description: "algorithms visualized",
      rating: 5,
    },
    {
      id: 11,
      title: "Storybook",
      url: "https:\\storybookjs.org",
      description: "UI component explorer",
      rating: 5,
    },
    {
      id: 12,
      title: "GitHub",
      url: "https:\\github.com",
      description: "online code repository",
      rating: 5,
    },
    {
      id: 13,
      title: "Roblox",
      url: "https:\\www.roblox.com",
      description: "user-created games",
      rating: 5,
    },
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: "https://www.hackers.com",
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1,
  };
  const expectedBookmark = {
    ...maliciousBookmark,
    title:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };
  return {
    maliciousBookmark,
    expectedBookmark,
  };
}

module.exports = {
  makeTestBookmarks,
  makeMaliciousBookmark,
};
