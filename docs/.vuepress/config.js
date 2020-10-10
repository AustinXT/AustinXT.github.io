const sidebar = require('./sidebar')
const path = require('path')
module.exports = {
  title: '夜航星',
  description: '我要徒步穿越太阳系',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }]
  ],
  base: '',
  theme: 'reco',
  themeConfig: {
    nav: [
      { text: '首页', link: '/', icon: 'reco-home' },
      {
        text: '主题学习', items: [
          { text: '英语学习', link: '/topic/english-learning/' },
          { text: '算法笔记', link: '/topic/algorithm/' },
          { text: '信息分析', link: '/topic/info-analysis/' },
          { text: '中国金融系统', link: '/topic/financial-sys/' },
          { text: '前端', link: '/topic/frontend/' },
        ]
      },
      {
        text: '两年计划', items: [
          { text: '计算机科学', link: '/master/computer-science/' },
        ]
      }
    ],
    subSidebar: 'auto',
    sidebar,
    type: 'blog',
    // 博客配置
    blogConfig: {
      category: {
        location: 2,     // 在导航栏菜单中所占的位置，默认2
        text: '分类' // 默认文案 “分类”
      },
    },
    authorAvatar: '/avatar.png',
    // 友情连接
    friendLink: [
      {
        title: '文因互联',
        desc: '文因互联基于知识图谱技术和自然语言处理技术，为金融机构提供业务流程自动化和智能化解决方案。',
        logo: 'https://memect.cn/img/logo.svg',
        link: 'http://blog.memect.cn/'
      },
      {
        title: '阳志平的网志',
        desc: '致力于认知科学的产品开发、课程设计与科学传播。',
        logo: 'https://www.yangzhiping.com/images/ouyang2015.jpg',
        link: 'https://www.yangzhiping.com/'
      },
    ],
    // 评论
    valineConfig: {
      appId: 'MEPBEkRHgqXkjQJ7Pi0u1f0P-gzGzoHsz',// your appId
      appKey: '5gcDkRQSjKAfKS5iH85yaCDr', // your appKey
      showComment: false
    },
    // 备案
    record: '浙ICP备19014045号-2',
    // 项目开始时间，只填写年份
    startYear: '2017',
    author: '夜航星'
  },
  markdown: {
    lineNumbers: true
  },
  plugins: [
    ['@vuepress/active-header-links'],
    [
      'vuepress-plugin-mathjax',
      {
        target: 'svg',
        macros: {
          '*': '\\times',
          '\\Z': '\\mathbb{Z}',
        },
      },
    ]
  ]
}  