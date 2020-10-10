module.exports = {
  '/topic/english-learning/': [
    '',
    'ch00/preface',
    {
      title: '第一部分：最小单元',
      collapsable: true,
      children: [
        'ch01/',
        {
          collapsable: false,
          children: [
            'ch01/2017-04-03-learning-American-english-1',
            'ch01/2017-04-03-learning-American-english-2',
            'ch01/2017-04-03-learning-American-english-3'
          ]
        },
        'ch02/',
        {
          collapsable: false,
          children: [
            'ch02/2017-06-11-learning-words-1',
            'ch02/2017-06-11-learning-words-2',
            'ch02/2017-06-11-learning-words-3',
            'ch02/2017-06-11-learning-words-4',
            'ch02/2017-12-06-anki-for-vocabulary'
          ]
        },
        'ch03/',
        {
          collapsable: false,
          children: [
            'ch03/2018-09-16-simple-sentence',
            'ch03/2018-09-16-complex-and-compound-sentence',
            'ch03/2018-09-16-reduced-clause',
            'ch03/2018-09-16-inverted-sentence',
          ]
        },
        'ch04/'
      ]
    },
    {
      title: '第二部分：你说我听',
      collapsable: true,
    }
  ],
  '/topic/algorithm/': [
    '',
    {
      title: 'Part 1：入门篇',
      collapsable: true,
      children: [
        'ch01/',
        {
          collapsable: false,
          children: [
            'ch01/basic-arithmetric'
          ]
        },
        'ch02/',
        {
          collapsable: false,
          children: [
            'ch02/sort',
            'ch02/hash',
            'ch02/greedy',
            'ch02/binary',
            'ch02/hight-efficiency-tip'
          ]
        },
        'ch03/',
        {
          collapsable: false,
          children: [
            'ch03/calculation',
            'ch03/gcf',
            'ch03/prime-number',
            'ch03/combination-number'
          ]
        }
      ],
    },
    {
      title: 'Part2：提高篇',
      collapsable: true,
      children: [
        'ch04/',
        {
          collapsable: false,
          children: [
            'ch04/stack',
            'ch04/dfs',
            'ch04/queue',
            'ch04/bfs',
            'ch04/list',
            'ch04/array-and-matrix'
          ]
        },
        'ch05/',
        {
          collapsable: false,
          children: [
            'ch05/tree-and-bt',
            'ch05/bt-traversal',
            'ch05/threaded-bt',
            'ch05/tree-traversal',
            'ch05/bst',
            'ch05/avl-tree',
            'ch05/disjoint-set',
            'ch05/heap',
            'ch05/huffman-tree'
          ]
        },
        'ch06/',
        {
          collapsable: false,
          children: [
            'ch06/graph-traversal',
            'ch06/shortest-path',
            'ch06/minimum-spanning-tree',
            'ch06/topological-sorting',
            'ch06/critical-path'
          ]
        }
      ]
    }
  ],
  '/master/computer-science/': [
    ''
  ]
}