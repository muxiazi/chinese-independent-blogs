/**
 * 1. Get original CSV of feeds
 * 2. Get follower counts for each feed
 * 3. Order by follower count
 */

const fs = require('fs');
const markdownTable = require('markdown-table');

const data = fs.readFileSync('./blogs-original.csv');
const rows = data.toString().split('\n');

const table = rows
  .map(row => row.split(',').map(column => column.trim()))
  .filter((row, i) => row.length === 4 && i !== 0)
  .map(row => row.push(-1) && row) // row[4] to store count of RSS subscribers

const {  GraphQLClient } = require('graphql-request');

const endpoint = 'https://api.feeds.pub/graphql'
const client = new GraphQLClient(endpoint, {errorPolicy: "ignore"});


async function getResultAndUpdateREADME() {
  // Get follower counts
  const feedLinks = table.map(row => row[2]);
  const queries = feedLinks.map((feedLink, i) => {
    if (feedLink) {
      return `f${i}: feed(id: "${feedLink}") {
        followerCount
      }`
    } else return '';
  })

  for (let i = 0; i < queries.length; i += 99) {
    const query = `{
        ${queries.slice(i, i + 99).join('\n')}
      }`

    const data = await client.request(query);

    Object.keys(data).forEach(key => {
      const index = Number(key.replace('f', ''));
      const count = data[key] ? data[key].followerCount : 0;
      table[index][4] = count;
    });

    console.log(`Got followerCount for ${i} to ${i + 99}`);
  }

  // Order by follower count
  table.sort((a, b) => (b[4] - a[4]) || (a[0] - b[0]));

  const getFeedsPubBtn = (feedLink, followCount) => {
    return '[![Follow on Feeds Pub]('
      +
      `https://img.shields.io/static/v1?label=follow&message=${followCount}&style=social&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAABFCAYAAAAcjSspAAAACXBIWXMAAAInAAACJwG+ElQIAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAASkSURBVHgB7Ztdcts2EMf/oDyeNO5MnBOUN4hzAtNvrZ0H8QSimwPEPoHlE9g5gZkTSJ46mU77YPYEVd/6yN5AnWkzrVNxuxAhN3UA0YL46eA3Y30AkDT8c7FY7MKAw+FwlIfAAyAafe2rl/w8m8bhjxOsQedEiUbBNrAVeQLPCBTwJfiaYROiWRiH36ewYAMdIBfiUV+I3oDfBrKN5j3Ge7rDYy/4eQ8WtFoUOS08zxsQiSN+u73ap7EDS1opCosR8J0+4ZcBEWyZwpJWiRKN9tnsxRnUFFkHIjqFJa1wtNJneN7WCVvFEexgqyD+E1MBkWaUXcbhuxiWNC7Ky8sXrzKiIVbzGVO2hDeANwb+mMRhYj1VdDQmytw6xJcXvKz2V/hYwk73NA6vElRII6Io3zHCPNgqhK1CvGaLOC/bIkzU7mij0TccbwgZQxRNl9rFWFCrpby8PBhkhLhoHPsLFuP9sG4xFtQmioo9rguGcXgujqv2GUX0UAMyMmVBpA8xThllHYdx+MOvaJhafIqyEN/Qzb7DY+v4LkZLqFwUFYf4hm4Zb+yxIGtt9cumUp+ipo3RSliQ5xx5tkoQiYdK8QIYBcFxGwWRVCoKxyMnhi4Ozd+eo6VUJopKEfq6PqKbQ7SYCh3txs4iP3aHqRCbZ4fjA16eSS3RIp0/CkyyjH4BssQ2lVgGFYqS7Rj8uBQiyF/e9vvygf0MB3iyrYdvxwdxRrPTJsSpZPrkq47YxRqwjUW8cv0sN4+omdJFkXGJvBiUkD1jtlnc649KGLVQ2vTJ8yOPzzhQi1AuPN08mZGzzcqtTCmWIgURYuuaICJUAFvLADWydkS7EAT3LClwFPsT3wuOUbIU2OTUwI20BOl85WrEuRYM9J/782lnkkwq4XxvZ8h3/auL/tXY0D0+HO/v6qp+vc3HT7BG2WIV1po+vDJEFhl4P6/4mRDaC5/dfHiKmlhLlCVhvIw5ONtOqb73i0DXGo36UiyD1X1IURPWokgrgXn3+5r3NlHuPzQ/anCcPe8fk0NN60xNWouyxEr4At6pKSUS3QBepYK7U0jGIqr+oxmPBDViJYqKMn1dH+dYP9rsbUqHqrvD84rgf993m3fR+xoSb1AjVktyNDo44qXzTNM1uei/ff7/sfvnbFWvdN8jRG4ZBacKEv5OqyMVtlgtyewTdkmzAybKNHc045ikpxWFxRiiAKJZ7WkGq+lDt1v+u/Q+yaTJXW5e1LL4nXl2rjO7ZFMi+m/DCrEx5IcUq/zCvGbcTHbOUhTh61pNB/DicMxZ+5n0CynuQW4hV0M0xMqiqABLx9I4Ip9Gsz1ejsdLhiV5hr/Z/K2Fo/1r21BYLAyulH8Io9GLgB2wLLQ/ExzWZ5T9Js+aNF0uXdDI8S518Qlaio1P8Q3tKR4IFRfDuokTRYONKKmh3ccDwVmKBieKBieKBgtRHpmCtKLTjp1hZVHkPsbQ9fmK8jlgK4rWWpaXLrqDbT5FK4oqWHUeN300OFE0OFE02KYjU13r7Ob973gA2GXziY5xZwXKE83N/NdF2VifT8mPXHlHXAN6knEFry2pRIfD4XA4usm//qauBcoh1b8AAAAASUVORK5CYII=`
      +
      `)](https://feeds.pub/feed/${encodeURIComponent(feedLink)})`;
  }
  const newTable = table.map(row => {
    return [
      row[2] ? getFeedsPubBtn(row[2], row[4]) : '',
      row[0].replace(/\|/g, '&#124;'),
      row[1],
      row[3]
    ]
  });

  // update README
  const tableContentInMD = markdownTable([['RSS 订阅数', '简介', '链接', '标签'], ...newTable]);

  const readmeContent = `

> Update: 社会化的 RSS 阅读器上线了，欢迎试用—— [Feeds Pub](https://feeds.pub)

# 中文独立博客列表

  [![](https://badgen.net/badge/icon/Website?icon=chrome&label)](https://feeds.pub/cn-indie)  [![](https://badgen.net/badge/icon/Telegram?icon=telegram&label)](https://t.me/indieBlogs)  [![](https://badgen.net/badge/icon/Blog?icon=chrome&label)](https://blog.t9t.io/cn-indie-blogs-2019-10-29/)

## Sponsors

[琚致远](https://github.com/juzhiyuan) | [Bytebase](https://bytebase.com/) | [Madao](https://madao.me/) | [SecondState](https://bit.ly/3gfWwps)

[Become a sponsor](https://github.com/sponsors/timqian)

## 目录

- [博客列表](#博客列表)
- [什么是独立博客](#什么是独立博客)
  - [如何提交](#如何提交)
- [为什么要收集这张列表](#为什么要收集这张列表)

## 博客列表

> 暂时根据各 RSS 服务订阅数据排了个先后顺序。 欢迎加入 [Telegram 群](https://t.me/indieBlogs) 讨论如何更好地组织和利用这个列表

${tableContentInMD}

## 什么是独立博客

- 拥有自己的域名
- 作者本人原创内容

### 如何提交

1. 在 [./blogs-original.csv](./blogs-original.csv) 中填入博客的 名称、URL、RSS以及标签
2. 提交 PR
3. (自动) PR 被 merge 之后 README 通过 [./script.js](./script.js) 生成

## 为什么要收集这张列表

不止一次听到有人说：“在中国, 独立博客的时代已经过去了”。确实，很多博主都转到了公众号，知乎专栏，小密圈，微博……  
这些平台读者比较多、他们的推荐算法可以让你的内容被更多人看到。  
  
但我还是更喜欢独立博客，因为有属于自己的域名，因为可以自由地排版，自由地说话。

不得不承认，独立博客在如何获取新读者方面确实存在问题。“酒香也怕巷子深”，同样的内容放在自己的博客和上述的“自媒体平台”上，哪怕有自己的主动宣传，读者的增长速度看起来也远不及自媒体平台上的增粉速度，对吧？

是否可以做一个工具，可以连接这些独立博主，在保持独立博客的自由的同时，组织一个独立博客的创作和读者群体，让独立博客们也有一个稳定的被发现的渠道。这个工具可能是一个带个性化推荐系统的 RSS 客户端，可能是一个类似微博、twitter 但是主要内容是独立博客的新东西，读者可以点赞，评论。可以知道我们 follow 的博主 follow 了谁……

这个列表是一个开始，先把独立博客们收集起来。欢迎加入 [Telegram 群](https://t.me/indieBlogs)一起思考和讨论如何构建这样一个工具。或者你也可以通过 email [订阅更新](https://mailchi.mp/7585311373a3/indieblogs)

## Thanks

- https://feedly.com
- t9t.io community: https://wewe.t9t.io/chat/t9t.io%20community%202 https://wewe.t9t.io/chat/t9t.io%20community
- https://github.com/DIYgod/RSSHub
- https://ohmyrss.com/
- https://github.com/tangqiaoboy/iOSBlogCN
- https://www.zhihu.com/question/19928148

## 博客构建工具推荐

  - [Blogdown](https://github.com/rstudio/blogdown)
  - [Docusaurus](https://docusaurus.io/)
  - [Gatsby](https://gatsbyjs.org/)
  - [Ghost](https://ghost.org/)
  - [Gride](https://gridea.dev/)
  - [Halo](https://github.com/halo-dev/halo)
  - [Hexo](https://hexo.io/)
  - [Hugo](https://gohugo.io/)
  - [Jekyll](https://jekyllrb.com/)
  - [Pelican](https://blog.getpelican.com/)
  - [Saber](https://saber.land/)
  - [Typecho](https://typecho.org)
  - [Vuepress](https://vuepress.vuejs.org/)
  - [Wordpress](https://wordpress.com/)
  - [Wowchemy](https://wowchemy.com)
  - [Hugo](https://gohugo.io/)
  - [Typecho](https://typecho.org/)

## 博客部署工具推荐

  - [Netlify](https://www.netlify.com/)
  - [Vercel](https://vercel.com/)
`

  fs.writeFileSync('./README.md', readmeContent, 'utf8');

  console.log('README.md 文件生成成功！');
}

getResultAndUpdateREADME()
