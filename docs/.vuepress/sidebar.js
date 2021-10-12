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
    },
    {
      title: 'Part3：拓展篇',
      collapsable: true,
      children: [
        'ch07/',
        'ch08/',
      ]
    }
  ],
  // '/topic/operating-sys/': [
  //   '',
  //   'ch00/',
  //   {
  //     title: '第一部分',
  //     collapsable: true,
  //     children: [
  //       'ch01/',
  //       'ch02/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch02/process',
  //           'ch02/process-synchronization',
  //           'ch02/process-communication',
  //           'ch02/threads',
  //         ]
  //       },
  //       'ch03/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch03/scheduling',
  //           'ch03/deadlock',
  //         ]
  //       }
  //     ]
  //   },
  //   {
  //     title: '第二部分',
  //     collapsable: true,
  //     children: [
  //       'ch04/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch04/load-and-link',
  //           'ch04/swapping',
  //           'ch04/continuous-allocate-memory-management',
  //           'ch04/paged-memory-management',
  //           'ch04/segmented-memory-management',
  //           'ch04/demand-paging-storage-management',
  //           'ch04/page-replacement-algorithm',
  //           'ch04/demand-segmented-storage-management',
  //         ]
  //       },
  //       'ch05/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch05/equipment-and-adapter',
  //           'ch05/interrupt-handler',
  //           'ch05/device-driver',
  //           'ch05/independent-iosw',
  //           'ch05/user-iosw',
  //           'ch05/buffer',
  //         ]
  //       },
  //       'ch06/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch06/file-logical-structure',
  //           'ch06/file-director',
  //           'ch06/file-sharing',
  //           'ch06/file-proctection',
  //         ]
  //       },
  //       'ch07/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch07/organization-of-disk',
  //           'ch07/storage-management-for-file',
  //           'ch07/improving-speed-of-disk',
  //           'ch07/improving-reliability-of-disk',
  //           'ch07/data-unison-control',
  //         ]
  //       },
  //       'ch08/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch08/user-port',
  //           'ch08/system-call',
  //           'ch08/system-call-realization',
  //         ]
  //       }
  //     ]
  //   },
  //   {
  //     title: '第三部分',
  //     collapsable: true,
  //     children: [
  //       'ch09/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch09/mps',
  //           'ch09/mps-process-synchronization',
  //           'ch09/mps-scheduling',
  //           'ch09/network-os',
  //           'ch09/distributed-file-system',
  //         ]
  //       },
  //       'ch10/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch10/media-process-management',
  //           'ch10/media-scheduling',
  //           'ch10/media-server',
  //           'ch10/media-storage',
  //           'ch10/media-io',
  //         ]
  //       },
  //       'ch11/',
  //       {
  //         collapsable: false,
  //         children: [
  //           'ch11/data-encrypt',
  //           'ch11/user-authentication',
  //           'ch11/attack-inside',
  //           'ch11/attack-outside',
  //           'ch11/trusted-system',
  //         ]
  //       },
  //     ]
  //   },
  //   {
  //     title: '第四部分',
  //     collapsable: true,
  //     children: [
  //       'ch12/',
  //       'ps/'
  //     ],
  //   }
  // ]
}
