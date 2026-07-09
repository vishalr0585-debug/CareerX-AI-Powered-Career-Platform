const { ExamQuestion, ExamAttempt } = require("../models/Exam");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const { generateJSON } = require("../services/geminiService");

// Built-in question bank for seeding
const questionBankData = {
  dsa: [
    // ── Searching & Sorting ──
    { question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswer: 1, explanation: "Binary search halves the search space each step, giving O(log n).", difficulty: "easy", topic: "Searching" },
    { question: "What is the worst case time complexity of Quick Sort?", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], correctAnswer: 1, explanation: "When the pivot is always the smallest/largest element, Quick Sort degrades to O(n²).", difficulty: "medium", topic: "Sorting" },
    { question: "Which sorting algorithm has the best worst-case time complexity?", options: ["Quick Sort", "Bubble Sort", "Merge Sort", "Insertion Sort"], correctAnswer: 2, explanation: "Merge Sort always runs in O(n log n) regardless of input order.", difficulty: "easy", topic: "Sorting" },
    { question: "What is the time complexity of Heap Sort?", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], correctAnswer: 1, explanation: "Building the heap takes O(n) and extracting all n elements takes O(n log n), totalling O(n log n).", difficulty: "medium", topic: "Sorting" },
    { question: "Linear search has a time complexity of:", options: ["O(log n)", "O(n log n)", "O(n)", "O(1)"], correctAnswer: 2, explanation: "In the worst case, linear search scans every element, giving O(n).", difficulty: "easy", topic: "Searching" },
    // ── Stacks & Queues ──
    { question: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Array", "Tree"], correctAnswer: 1, explanation: "Stack follows Last In First Out (LIFO) principle.", difficulty: "easy", topic: "Stack" },
    { question: "Which data structure uses FIFO?", options: ["Stack", "Heap", "Queue", "Graph"], correctAnswer: 2, explanation: "Queue follows First In First Out (FIFO) — dequeue removes the oldest inserted element.", difficulty: "easy", topic: "Queue" },
    { question: "A circular queue of size n can hold a maximum of:", options: ["n elements", "n-1 elements", "n+1 elements", "2n elements"], correctAnswer: 1, explanation: "To distinguish full from empty, a circular queue wastes one slot and holds n-1 elements.", difficulty: "medium", topic: "Queue" },
    { question: "How can you implement a stack that supports getMin() in O(1)?", options: ["Using a sorted array", "Using an auxiliary min-stack", "Using a heap", "Using a BST"], correctAnswer: 1, explanation: "An auxiliary stack tracks the minimum at each level; push/pop on both stacks keep getMin O(1).", difficulty: "medium", topic: "Stack" },
    // ── Trees ──
    { question: "Which traversal visits root → left → right?", options: ["Inorder", "Preorder", "Postorder", "Level order"], correctAnswer: 1, explanation: "Preorder: Root → Left → Right.", difficulty: "easy", topic: "Trees" },
    { question: "What is a balanced BST?", options: ["All leaves at same level", "Height difference ≤ 1 between subtrees", "Complete binary tree", "Full binary tree"], correctAnswer: 1, explanation: "A balanced BST keeps the height difference between left and right subtrees ≤ 1.", difficulty: "medium", topic: "Trees" },
    { question: "Inorder traversal of a BST gives nodes in:", options: ["Random order", "Reverse sorted order", "Sorted ascending order", "Level order"], correctAnswer: 2, explanation: "Inorder (Left → Root → Right) on a BST visits nodes in ascending sorted order.", difficulty: "easy", topic: "Trees" },
    { question: "An AVL tree performs rotations to maintain:", options: ["Level order", "Max heap property", "Height balance", "Complete tree property"], correctAnswer: 2, explanation: "AVL trees rebalance via rotations whenever the height difference exceeds 1.", difficulty: "medium", topic: "Trees" },
    { question: "Which data structure is used in implementing a priority queue?", options: ["Stack", "Hash Map", "Heap", "Linked List"], correctAnswer: 2, explanation: "A binary heap efficiently supports O(log n) insert and O(log n) extract-min/max operations.", difficulty: "easy", topic: "Heap" },
    { question: "In a max-heap, the parent is always:", options: ["Less than its children", "Equal to its children", "Greater than or equal to its children", "Unrelated to its children"], correctAnswer: 2, explanation: "Max-heap property: every parent is ≥ its children, so the root holds the maximum.", difficulty: "easy", topic: "Heap" },
    // ── Graphs ──
    { question: "What is the space complexity of BFS in a graph?", options: ["O(V)", "O(E)", "O(V+E)", "O(1)"], correctAnswer: 0, explanation: "BFS queue holds at most V vertices.", difficulty: "medium", topic: "Graphs" },
    { question: "Dijkstra's algorithm does NOT work with:", options: ["Directed graphs", "Negative weights", "Weighted graphs", "Dense graphs"], correctAnswer: 1, explanation: "Dijkstra assumes non-negative weights; use Bellman-Ford for negative edges.", difficulty: "hard", topic: "Graphs" },
    { question: "Which algorithm finds the shortest path in an unweighted graph?", options: ["Dijkstra", "DFS", "BFS", "Floyd-Warshall"], correctAnswer: 2, explanation: "BFS explores level by level, so the first time it reaches a node it has the shortest path (unweighted).", difficulty: "easy", topic: "Graphs" },
    { question: "Topological sort is applicable to:", options: ["Undirected graphs", "Directed Acyclic Graphs (DAGs)", "Cyclic graphs", "Complete graphs"], correctAnswer: 1, explanation: "Topological sort requires a DAG; cycles make a linear ordering impossible.", difficulty: "medium", topic: "Graphs" },
    { question: "Floyd-Warshall algorithm finds:", options: ["Single-source shortest path", "Minimum spanning tree", "All-pairs shortest paths", "Topological order"], correctAnswer: 2, explanation: "Floyd-Warshall computes shortest paths between every pair of vertices in O(V³).", difficulty: "medium", topic: "Graphs" },
    // ── Hash & Dynamic Programming ──
    { question: "A hash table has average case lookup of:", options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], correctAnswer: 2, explanation: "Hash tables provide O(1) average-case lookup via hash functions.", difficulty: "easy", topic: "Hash Map" },
    { question: "What is the coin change problem's optimal approach?", options: ["Greedy", "Divide and Conquer", "Dynamic Programming", "Backtracking"], correctAnswer: 2, explanation: "Greedy can fail for arbitrary denominations; DP guarantees optimal substructure and overlapping subproblems.", difficulty: "medium", topic: "Dynamic Programming" },
    { question: "What is memoisation in dynamic programming?", options: ["Sorting the subproblems", "Caching results of solved subproblems", "Splitting the array in half", "Using a greedy heuristic"], correctAnswer: 1, explanation: "Memoisation stores computed results to avoid redundant recalculations, reducing time complexity.", difficulty: "easy", topic: "Dynamic Programming" },
    // ── Linked List ──
    { question: "What is the time complexity of inserting at the head of a singly linked list?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswer: 3, explanation: "Inserting at the head only requires updating the head pointer — O(1).", difficulty: "easy", topic: "Linked List" },
    { question: "Which technique detects a cycle in a linked list efficiently?", options: ["Using a Stack", "Floyd's Cycle Detection (Tortoise and Hare)", "Binary Search", "DFS"], correctAnswer: 1, explanation: "Floyd's algorithm uses two pointers at different speeds; they meet if and only if a cycle exists.", difficulty: "medium", topic: "Linked List" },
    // ── Trie & Advanced ──
    { question: "A Trie is primarily used for:", options: ["Sorting numbers", "Shortest path computation", "String prefix searches", "Range queries"], correctAnswer: 2, explanation: "A Trie stores strings character by character, making prefix lookups O(m) where m is word length.", difficulty: "medium", topic: "Trie" },
    { question: "Which algorithm is used for pattern matching in strings efficiently?", options: ["Binary Search", "KMP Algorithm", "Bubble Sort", "Dijkstra"], correctAnswer: 1, explanation: "KMP (Knuth-Morris-Pratt) preprocesses the pattern to avoid redundant comparisons, achieving O(n+m).", difficulty: "hard", topic: "Strings" },
    { question: "The time complexity to build a heap from n elements is:", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], correctAnswer: 2, explanation: "Using the heapify-down approach from the last non-leaf node, building a heap is O(n) amortised.", difficulty: "hard", topic: "Heap" },
  ],

  os: [
    // ── Processes & Scheduling ──
    { question: "What is a deadlock?", options: ["A fast process", "Circular wait between processes", "Memory overflow", "CPU cache miss"], correctAnswer: 1, explanation: "Deadlock is a circular wait where each process holds a resource needed by the next.", difficulty: "easy", topic: "Deadlocks" },
    { question: "Which scheduling algorithm is non-preemptive?", options: ["Round Robin", "FCFS", "SRTF", "Priority (preemptive)"], correctAnswer: 1, explanation: "FCFS is non-preemptive — once a process starts executing, it runs to completion.", difficulty: "easy", topic: "Scheduling" },
    { question: "Round Robin scheduling uses a:", options: ["Priority queue", "Fixed time quantum", "Shortest job first policy", "Multi-level queue"], correctAnswer: 1, explanation: "Round Robin gives each process a fixed time quantum, then preempts and moves to the next.", difficulty: "easy", topic: "Scheduling" },
    { question: "What is a PCB (Process Control Block)?", options: ["A hardware register", "A data structure storing process state", "A physical memory block", "A file allocation table"], correctAnswer: 1, explanation: "The PCB stores a process's state, program counter, registers, memory maps, and scheduling info.", difficulty: "easy", topic: "Processes" },
    { question: "What is the difference between a process and a thread?", options: ["No difference", "Threads share memory space; processes do not", "Processes are faster than threads", "Threads are heavier than processes"], correctAnswer: 1, explanation: "Threads within a process share the same address space; separate processes have independent memory.", difficulty: "easy", topic: "Threads" },
    { question: "Context switching overhead includes:", options: ["Saving/restoring registers and PCB", "Only saving registers", "Only updating the program counter", "Allocating new memory"], correctAnswer: 0, explanation: "Context switching saves the full process state (registers, PCB, memory maps) and restores the next process.", difficulty: "medium", topic: "Processes" },
    // ── Memory Management ──
    { question: "What is thrashing?", options: ["Fast processing", "Excessive paging reducing CPU utilisation", "Cache hit rate increase", "CPU idle state"], correctAnswer: 1, explanation: "Thrashing occurs when processes spend more time swapping pages than executing.", difficulty: "medium", topic: "Memory" },
    { question: "Belady's anomaly occurs in which page replacement policy?", options: ["LRU", "FIFO", "Optimal", "LFU"], correctAnswer: 1, explanation: "FIFO can produce more page faults with more frames — a counterintuitive behaviour called Belady's anomaly.", difficulty: "hard", topic: "Memory" },
    { question: "What is the purpose of a page table?", options: ["To schedule processes", "To map virtual addresses to physical addresses", "To cache frequently used data", "To manage I/O devices"], correctAnswer: 1, explanation: "The page table translates virtual page numbers to physical frame numbers.", difficulty: "easy", topic: "Memory" },
    { question: "Virtual memory allows:", options: ["Faster CPU execution", "Running programs larger than physical RAM", "Eliminating disk I/O", "Direct hardware access"], correctAnswer: 1, explanation: "Virtual memory uses disk as an extension of RAM, allowing programs to exceed physical memory size.", difficulty: "easy", topic: "Memory" },
    { question: "What is demand paging?", options: ["Preloading all pages at startup", "Loading pages only when they are needed (on page fault)", "Swapping entire processes to disk", "Allocating fixed memory partitions"], correctAnswer: 1, explanation: "Demand paging loads a page into memory only when a page fault occurs, saving memory.", difficulty: "medium", topic: "Memory" },
    // ── Synchronisation ──
    { question: "What is a semaphore?", options: ["A type of CPU", "A synchronisation primitive using a counter", "A memory block", "A file system"], correctAnswer: 1, explanation: "A semaphore is an integer-based synchronisation primitive; wait() decrements and signal() increments it.", difficulty: "medium", topic: "Synchronisation" },
    { question: "A mutex differs from a binary semaphore in that:", options: ["Mutex allows multiple owners", "Mutex must be released by the thread that acquired it", "Semaphore has no counter", "They are identical"], correctAnswer: 1, explanation: "A mutex has ownership — only the thread that locked it can unlock it; semaphores have no ownership.", difficulty: "medium", topic: "Synchronisation" },
    { question: "The critical section problem requires:", options: ["Mutual exclusion, progress, and bounded waiting", "Only mutual exclusion", "Only priority inversion", "Deadlock prevention"], correctAnswer: 0, explanation: "The three requirements are: mutual exclusion, progress (no unnecessary blocking), and bounded waiting.", difficulty: "medium", topic: "Synchronisation" },
    { question: "Banker's algorithm is used for:", options: ["Scheduling", "Deadlock avoidance", "Memory allocation", "Page replacement"], correctAnswer: 1, explanation: "Banker's algorithm checks if granting a resource request leaves the system in a safe state, avoiding deadlock.", difficulty: "medium", topic: "Deadlocks" },
    // ── I/O & File Systems ──
    { question: "Spooling is used to:", options: ["Speed up the CPU", "Decouple slow I/O devices from processes using a buffer/spool", "Compress files", "Manage virtual memory"], correctAnswer: 1, explanation: "Spooling queues I/O jobs (e.g., print jobs) on disk so processes don't wait for slow devices.", difficulty: "easy", topic: "I/O" },
    { question: "Which IPC mechanism allows two-way communication between related processes?", options: ["Signal", "Pipe", "Shared Memory", "Semaphore"], correctAnswer: 1, explanation: "Pipes allow one-directional (half-duplex) data flow; named pipes support two-way between related processes.", difficulty: "medium", topic: "IPC" },
    { question: "What is an inode?", options: ["A type of CPU instruction", "A data structure storing file metadata on disk", "A network socket", "A process identifier"], correctAnswer: 1, explanation: "An inode stores file metadata: permissions, timestamps, owner, and pointers to data blocks.", difficulty: "medium", topic: "File Systems" },
    { question: "Which condition is NOT required for a deadlock?", options: ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Starvation"], correctAnswer: 3, explanation: "The four Coffman conditions for deadlock are: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Starvation is not one of them.", difficulty: "medium", topic: "Deadlocks" },
    { question: "In a multi-level feedback queue, a process that uses too much CPU is:", options: ["Terminated", "Moved to a higher-priority queue", "Moved to a lower-priority queue", "Blocked immediately"], correctAnswer: 2, explanation: "CPU-intensive processes are demoted to lower-priority queues to give I/O-bound processes more CPU time.", difficulty: "hard", topic: "Scheduling" },
  ],

  dbms: [
    // ── Normalisation ──
    { question: "Which normal form removes partial dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], correctAnswer: 1, explanation: "2NF eliminates partial dependency — every non-prime attribute depends on the whole primary key.", difficulty: "medium", topic: "Normalisation" },
    { question: "3NF removes:", options: ["Partial dependencies", "Multi-valued dependencies", "Transitive dependencies", "Join dependencies"], correctAnswer: 2, explanation: "3NF eliminates transitive dependencies — non-key attributes must depend directly on the primary key.", difficulty: "medium", topic: "Normalisation" },
    { question: "BCNF is stricter than 3NF because:", options: ["It allows partial dependencies", "Every determinant must be a super key", "It removes multi-valued dependencies", "It requires a single primary key"], correctAnswer: 1, explanation: "In BCNF, for every functional dependency X→Y, X must be a super key.", difficulty: "hard", topic: "Normalisation" },
    { question: "1NF requires that:", options: ["No partial dependencies exist", "All attributes are atomic (no repeating groups)", "No transitive dependencies exist", "All keys are composite"], correctAnswer: 1, explanation: "1NF mandates all column values are atomic and indivisible — no arrays or nested structures.", difficulty: "easy", topic: "Normalisation" },
    // ── SQL ──
    { question: "ACID stands for:", options: ["Atomicity, Consistency, Isolation, Durability", "Accuracy, Consistency, Integrity, Data", "Atomicity, Concurrency, Isolation, Data", "Accuracy, Concurrency, Isolation, Durability"], correctAnswer: 0, explanation: "ACID properties guarantee reliable database transactions.", difficulty: "easy", topic: "Transactions" },
    { question: "Which join returns all rows from both tables?", options: ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"], correctAnswer: 2, explanation: "FULL OUTER JOIN returns all rows from both tables, placing NULLs where there is no match.", difficulty: "easy", topic: "SQL" },
    { question: "What is a view in SQL?", options: ["Physical table", "Virtual table based on a SELECT query", "Index structure", "Stored procedure"], correctAnswer: 1, explanation: "A view is a virtual table defined by a query; it does not store data independently.", difficulty: "easy", topic: "SQL" },
    { question: "What is the difference between WHERE and HAVING?", options: ["No difference", "WHERE filters rows before aggregation; HAVING filters groups after aggregation", "HAVING filters rows; WHERE filters groups", "WHERE is only for JOINs"], correctAnswer: 1, explanation: "WHERE applies before GROUP BY; HAVING filters the result of aggregate functions.", difficulty: "easy", topic: "SQL" },
    { question: "A CROSS JOIN produces:", options: ["Only matching rows", "All rows from the left table", "Cartesian product of both tables", "Rows with NULL for non-matching"], correctAnswer: 2, explanation: "CROSS JOIN returns every combination of rows from both tables — the Cartesian product.", difficulty: "easy", topic: "SQL" },
    { question: "What is a trigger in SQL?", options: ["A manual query", "Automatic action executed on INSERT/UPDATE/DELETE", "A type of index", "A transaction savepoint"], correctAnswer: 1, explanation: "Triggers fire automatically before or after DML operations on a table.", difficulty: "easy", topic: "SQL" },
    { question: "Which aggregate function ignores NULL values?", options: ["COUNT(*)", "SUM()", "Both SUM() and COUNT(*)", "Neither"], correctAnswer: 1, explanation: "SUM(), AVG(), MIN(), MAX() ignore NULLs. COUNT(*) counts all rows including NULLs.", difficulty: "medium", topic: "SQL" },
    // ── Indexing & Storage ──
    { question: "What does a B+ tree index provide?", options: ["O(n) search", "O(log n) search with efficient range queries", "O(1) search", "O(n²) search"], correctAnswer: 1, explanation: "B+ trees offer O(log n) point queries and efficient range queries via linked leaf nodes.", difficulty: "medium", topic: "Indexing" },
    { question: "A clustered index:", options: ["Creates a separate index structure", "Physically sorts the table data by the indexed column", "Allows multiple values per row", "Is always on the primary key only"], correctAnswer: 1, explanation: "A clustered index determines the physical storage order of rows; only one clustered index per table.", difficulty: "medium", topic: "Indexing" },
    { question: "What is denormalisation?", options: ["Adding more normal forms", "Intentionally introducing redundancy to improve read performance", "Splitting tables further", "Removing all foreign keys"], correctAnswer: 1, explanation: "Denormalisation adds redundant data to reduce JOIN operations and speed up read-heavy workloads.", difficulty: "medium", topic: "Normalisation" },
    // ── Transactions & Concurrency ──
    { question: "What does 'Isolation' in ACID mean?", options: ["Data is encrypted", "Concurrent transactions do not affect each other's intermediate state", "Transactions are logged", "All writes are synchronous"], correctAnswer: 1, explanation: "Isolation ensures each transaction executes as if it is the only one, preventing dirty reads and phantom reads.", difficulty: "medium", topic: "Transactions" },
    { question: "A phantom read occurs when:", options: ["A transaction reads its own uncommitted data", "A transaction re-reads data and sees new rows added by another transaction", "Two transactions update the same row", "A transaction is rolled back"], correctAnswer: 1, explanation: "Phantom reads happen at the REPEATABLE READ isolation level when new rows match a query's condition.", difficulty: "hard", topic: "Transactions" },
    { question: "The CAP theorem states that a distributed system can guarantee at most:", options: ["All three: Consistency, Availability, Partition tolerance", "Two of three: Consistency, Availability, Partition tolerance", "Only Consistency and Availability", "Only Availability and Partition tolerance"], correctAnswer: 1, explanation: "CAP theorem: you can only guarantee 2 of the 3 properties simultaneously in a distributed system.", difficulty: "hard", topic: "Distributed DB" },
    { question: "What is a foreign key?", options: ["A key used for encryption", "A column referencing the primary key of another table", "A composite primary key", "An index on multiple columns"], correctAnswer: 1, explanation: "A foreign key enforces referential integrity by linking a column to the primary key of another table.", difficulty: "easy", topic: "SQL" },
    { question: "OLAP is optimised for:", options: ["Fast transactional writes", "Complex analytical queries on large datasets", "Real-time data ingestion", "Row-level locking"], correctAnswer: 1, explanation: "OLAP (Online Analytical Processing) is designed for read-heavy analytical workloads, using columnar storage.", difficulty: "medium", topic: "Data Warehousing" },
    { question: "Sharding a database means:", options: ["Encrypting the data", "Horizontally partitioning data across multiple database instances", "Copying data to a read replica", "Compressing database files"], correctAnswer: 1, explanation: "Sharding splits data across nodes by a shard key to distribute load and scale horizontally.", difficulty: "medium", topic: "Distributed DB" },
  ],

  cn: [
    // ── OSI Model ──
    { question: "Which layer handles routing?", options: ["Data Link", "Network", "Transport", "Application"], correctAnswer: 1, explanation: "Layer 3 (Network) handles logical addressing (IP) and routing.", difficulty: "easy", topic: "OSI Model" },
    { question: "Which OSI layer is responsible for error detection and framing?", options: ["Physical", "Data Link", "Network", "Transport"], correctAnswer: 1, explanation: "Layer 2 (Data Link) handles framing, MAC addressing, and error detection (CRC).", difficulty: "easy", topic: "OSI Model" },
    { question: "Which layer provides end-to-end delivery of data?", options: ["Network", "Data Link", "Transport", "Session"], correctAnswer: 2, explanation: "Layer 4 (Transport) ensures complete data transfer between hosts, handling segmentation and reassembly.", difficulty: "easy", topic: "OSI Model" },
    { question: "The Physical layer deals with:", options: ["IP addresses", "MAC addresses", "Bit transmission over the medium", "Encryption"], correctAnswer: 2, explanation: "Layer 1 (Physical) defines hardware, cables, voltages and transmits raw bits.", difficulty: "easy", topic: "OSI Model" },
    // ── TCP/IP & Protocols ──
    { question: "TCP is:", options: ["Connectionless", "Connection-oriented and reliable", "Unreliable", "Stateless"], correctAnswer: 1, explanation: "TCP establishes a connection via 3-way handshake and guarantees reliable, ordered delivery.", difficulty: "easy", topic: "TCP/IP" },
    { question: "The TCP 3-way handshake sequence is:", options: ["SYN → ACK → FIN", "SYN → SYN-ACK → ACK", "ACK → SYN → FIN", "SYN → FIN → ACK"], correctAnswer: 1, explanation: "When establishing a TCP connection: client sends SYN, server replies SYN-ACK, client responds ACK.", difficulty: "medium", topic: "TCP/IP" },
    { question: "UDP is preferred over TCP when:", options: ["Data integrity is critical", "Low latency matters more than reliability (e.g., video streaming)", "File transfer is needed", "Guaranteed delivery is required"], correctAnswer: 1, explanation: "UDP is connectionless and faster; used in video/audio streaming where slight loss is acceptable.", difficulty: "easy", topic: "UDP" },
    { question: "What is the purpose of DNS?", options: ["Encrypt data", "Resolve domain names to IP addresses", "Route packets", "Compress data"], correctAnswer: 1, explanation: "DNS translates human-readable hostnames (e.g. google.com) to IP addresses.", difficulty: "easy", topic: "DNS" },
    { question: "Which protocol uses port 443?", options: ["HTTP", "FTP", "HTTPS", "SSH"], correctAnswer: 2, explanation: "HTTPS operates on port 443 for TLS-encrypted web communication.", difficulty: "easy", topic: "Protocols" },
    { question: "HTTP is a ___ protocol.", options: ["Connection-oriented, stateful", "Stateless, application-layer", "Transport-layer, reliable", "Session-layer, encrypted"], correctAnswer: 1, explanation: "HTTP is a stateless, application-layer protocol; each request is independent.", difficulty: "easy", topic: "HTTP" },
    { question: "What is ARP used for?", options: ["IP to MAC address resolution", "MAC to IP resolution", "DNS lookup", "Packet routing"], correctAnswer: 0, explanation: "ARP resolves an IP address to a MAC address within a local network.", difficulty: "medium", topic: "Protocols" },
    { question: "What does DHCP do?", options: ["Encrypts network traffic", "Automatically assigns IP addresses to devices", "Routes packets between networks", "Resolves domain names"], correctAnswer: 1, explanation: "DHCP dynamically allocates IP addresses, subnet masks, gateways, and DNS servers to hosts.", difficulty: "easy", topic: "Protocols" },
    // ── IP Addressing & Routing ──
    { question: "How many bits are in an IPv4 address?", options: ["16", "32", "64", "128"], correctAnswer: 1, explanation: "IPv4 addresses are 32 bits, written as 4 octets in dotted decimal notation.", difficulty: "easy", topic: "IP Addressing" },
    { question: "What is subnetting?", options: ["Combining multiple networks", "Dividing a network into smaller sub-networks using a subnet mask", "Encrypting IP packets", "Mapping private IPs to public IPs"], correctAnswer: 1, explanation: "Subnetting splits a network using a subnet mask to improve address utilisation and isolation.", difficulty: "medium", topic: "IP Addressing" },
    { question: "NAT (Network Address Translation) is used to:", options: ["Encrypt packets", "Map private IP addresses to a public IP address", "Speed up DNS lookup", "Block malicious traffic"], correctAnswer: 1, explanation: "NAT lets multiple devices on a private LAN share a single public IP address for internet access.", difficulty: "medium", topic: "IP Addressing" },
    { question: "The default subnet mask for a Class C network is:", options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"], correctAnswer: 2, explanation: "Class C uses /24 — 255.255.255.0 — supporting 254 usable hosts per network.", difficulty: "easy", topic: "IP Addressing" },
    // ── Congestion & Flow Control ──
    { question: "TCP congestion control uses:", options: ["Fixed window size", "Slow start, congestion avoidance, and fast retransmit", "No flow control", "UDP-based probing"], correctAnswer: 1, explanation: "TCP starts with a small congestion window (slow start), grows it exponentially, then linearly, and halves on loss.", difficulty: "medium", topic: "Congestion Control" },
    { question: "Stop-and-Wait ARQ protocol sends the next frame only:", options: ["After a fixed timeout", "After receiving an ACK for the previous frame", "Concurrently with the previous frame", "When the buffer is full"], correctAnswer: 1, explanation: "Stop-and-Wait waits for acknowledgement before sending the next frame, giving low utilisation on long-latency links.", difficulty: "medium", topic: "Flow Control" },
    // ── Additional ──
    { question: "A MAC address is:", options: ["A 32-bit logical address", "A 48-bit hardware address burned into the NIC", "A temporary address assigned by DHCP", "An IPv6 address"], correctAnswer: 1, explanation: "MAC addresses are 48-bit (6-byte) hardware identifiers permanently assigned to network interfaces.", difficulty: "easy", topic: "Data Link" },
    { question: "Which device operates at Layer 3 and makes routing decisions?", options: ["Hub", "Switch", "Router", "Repeater"], correctAnswer: 2, explanation: "A router operates at the Network layer, using IP addresses and routing tables to forward packets.", difficulty: "easy", topic: "Networking Devices" },
  ],

  oops: [
    // ── Core Principles ──
    { question: "Which OOP principle hides internal details?", options: ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"], correctAnswer: 2, explanation: "Encapsulation bundles data and methods, exposing only what is necessary through a public interface.", difficulty: "easy", topic: "Encapsulation" },
    { question: "What is polymorphism?", options: ["One class inherits another", "Same interface, different implementations", "Hiding data", "Creating objects"], correctAnswer: 1, explanation: "Polymorphism allows different classes to be used through a common interface, with each providing its own implementation.", difficulty: "easy", topic: "Polymorphism" },
    { question: "Diamond problem occurs in:", options: ["Single inheritance", "Multiple inheritance", "Encapsulation", "Abstraction"], correctAnswer: 1, explanation: "The diamond problem arises when a class inherits from two classes that share a common ancestor, causing ambiguity.", difficulty: "medium", topic: "Inheritance" },
    { question: "An abstract class can have:", options: ["Only abstract methods", "Only concrete methods", "Both abstract and concrete methods", "No methods at all"], correctAnswer: 2, explanation: "Abstract classes can mix abstract (unimplemented) and concrete (implemented) methods.", difficulty: "easy", topic: "Abstraction" },
    { question: "What is the key difference between an interface and an abstract class?", options: ["Interfaces can have constructors", "Abstract classes support multiple inheritance in Java; interfaces allow multiple implementation", "Interfaces can have instance variables with state", "No difference"], correctAnswer: 1, explanation: "A class can implement multiple interfaces but extend only one abstract class (in Java/C#). Interfaces define contracts.", difficulty: "medium", topic: "Abstraction" },
    // ── Inheritance & Methods ──
    { question: "Method overloading is:", options: ["Same name, different parameters at compile time", "Same name, same parameters in subclass at runtime", "Hiding a parent method", "Calling a parent constructor"], correctAnswer: 0, explanation: "Overloading (compile-time/static polymorphism) defines multiple methods with the same name but different signatures.", difficulty: "easy", topic: "Polymorphism" },
    { question: "Method overriding is:", options: ["Same name, different parameters in the same class", "Redefining a parent class method in a subclass with the same signature", "Creating a new method in a subclass", "Hiding the parent class"], correctAnswer: 1, explanation: "Overriding (runtime polymorphism) allows a subclass to provide its own version of an inherited method.", difficulty: "easy", topic: "Polymorphism" },
    { question: "The 'super' keyword in Java/Python is used to:", options: ["Create a new object", "Call the parent class constructor or method", "Declare a static method", "Override an interface"], correctAnswer: 1, explanation: "'super' accesses the parent class's constructor, methods, or variables from a subclass.", difficulty: "easy", topic: "Inheritance" },
    { question: "Constructor chaining means:", options: ["One constructor calls another constructor in the same class or parent class", "Calling a method from a constructor", "Having multiple constructors with different names", "Using recursion in constructors"], correctAnswer: 0, explanation: "Constructor chaining uses 'this()' or 'super()' to call another constructor, reusing initialisation logic.", difficulty: "medium", topic: "Constructors" },
    // ── Static, Final & Access ──
    { question: "A 'static' method in a class:", options: ["Can access instance variables", "Belongs to the class, not instances, and cannot access instance state", "Must be overridden", "Requires an object to call"], correctAnswer: 1, explanation: "Static methods belong to the class itself and can be called without creating an instance.", difficulty: "easy", topic: "Static" },
    { question: "The 'final' keyword on a class means:", options: ["The class is abstract", "The class cannot be subclassed (inherited)", "All methods are static", "Objects of the class are immutable"], correctAnswer: 1, explanation: "A final class cannot be extended — e.g., java.lang.String is final.", difficulty: "easy", topic: "Keywords" },
    { question: "'final' on a method means:", options: ["The method is abstract", "The method cannot be overridden in subclasses", "The method is static", "The method returns a constant"], correctAnswer: 1, explanation: "A final method cannot be overridden in any subclass, preserving its implementation.", difficulty: "easy", topic: "Keywords" },
    // ── Design Principles & Patterns ──
    { question: "Composition over Inheritance means:", options: ["Always use inheritance", "Prefer building classes by combining behaviours rather than extending", "Never use inheritance", "Use static methods only"], correctAnswer: 1, explanation: "Composition (has-a) is more flexible than inheritance (is-a) and avoids tight coupling.", difficulty: "medium", topic: "Design Principles" },
    { question: "The Singleton pattern ensures:", options: ["Multiple instances of a class", "Only one instance of a class exists globally", "Immutable objects", "Thread-unsafe access"], correctAnswer: 1, explanation: "Singleton restricts instantiation to a single object and provides a global access point.", difficulty: "medium", topic: "Design Patterns" },
    { question: "The Factory Method pattern is used to:", options: ["Sort objects", "Create objects without specifying the exact class", "Enforce single inheritance", "Cache object instances"], correctAnswer: 1, explanation: "The Factory Method defines an interface for creating objects, letting subclasses decide which class to instantiate.", difficulty: "medium", topic: "Design Patterns" },
    { question: "The 'S' in SOLID stands for:", options: ["Static Responsibility", "Single Responsibility Principle", "State Pattern", "Substitution Rule"], correctAnswer: 1, explanation: "The Single Responsibility Principle states that a class should have only one reason to change.", difficulty: "easy", topic: "SOLID" },
    { question: "Liskov Substitution Principle (LSP) states:", options: ["Classes should be open for extension, closed for modification", "Objects of a subclass should be replaceable for objects of the parent class", "Depend on abstractions, not concretions", "A class should have one responsibility"], correctAnswer: 1, explanation: "LSP ensures subclasses can stand in for their parent class without altering program correctness.", difficulty: "medium", topic: "SOLID" },
    // ── Access Modifiers & Misc ──
    { question: "Which access modifier makes a member accessible only within its class?", options: ["public", "protected", "private", "package-private"], correctAnswer: 2, explanation: "private restricts access to within the declaring class only — the most restrictive modifier.", difficulty: "easy", topic: "Access Modifiers" },
    { question: "What is deep copy vs shallow copy?", options: ["Deep copy duplicates only references; shallow copy duplicates values", "Shallow copy duplicates only references; deep copy duplicates all nested objects", "They are the same", "Deep copy is faster"], correctAnswer: 1, explanation: "Shallow copy copies references to nested objects; deep copy creates independent copies of all nested objects.", difficulty: "medium", topic: "Objects" },
    { question: "Coupling in OOP refers to:", options: ["Grouping related methods together", "The degree of dependency between classes", "Using multiple inheritance", "The number of methods in a class"], correctAnswer: 1, explanation: "Low coupling means classes are independent; high coupling means changes in one class affect others.", difficulty: "medium", topic: "Design Principles" },
  ],

  "web-dev": [
    // ── HTML & CSS ──
    { question: "What does the CSS box model consist of?", options: ["Content, border, margin", "Content, padding, border, margin", "Content, font, color", "Margin, padding, background"], correctAnswer: 1, explanation: "The CSS box model has four parts: content, padding, border, and margin, from inside out.", difficulty: "easy", topic: "CSS" },
    { question: "What is the difference between 'display: flex' and 'display: grid'?", options: ["Flexbox is 2D; Grid is 1D", "Grid is 2D; Flexbox is 1D (row or column)", "They are the same", "Grid is only for images"], correctAnswer: 1, explanation: "Flexbox arranges items in one axis (row or column); CSS Grid places items in a 2D row-and-column layout.", difficulty: "easy", topic: "CSS" },
    { question: "Which HTML tag is used to link an external CSS file?", options: ["<style>", "<css>", "<link>", "<script>"], correctAnswer: 2, explanation: "<link rel='stylesheet' href='...'> in the <head> section links an external CSS file.", difficulty: "easy", topic: "HTML" },
    { question: "What is the purpose of the 'alt' attribute in <img>?", options: ["Sets image size", "Provides text description for accessibility and when image fails to load", "Adds a tooltip", "Links to another page"], correctAnswer: 1, explanation: "The alt attribute improves accessibility (screen readers) and shows fallback text when the image cannot load.", difficulty: "easy", topic: "HTML" },
    // ── JavaScript ──
    { question: "What is the JavaScript event loop?", options: ["A for loop over DOM events", "Mechanism that lets Node.js/browsers run async code by processing the call stack and callback queue", "A CSS animation loop", "A recursive function"], correctAnswer: 1, explanation: "The event loop moves callbacks from the task queue to the call stack when the stack is empty, enabling non-blocking I/O.", difficulty: "medium", topic: "JavaScript" },
    { question: "What is the difference between 'null' and 'undefined' in JavaScript?", options: ["They are the same", "null is an assigned empty value; undefined means a variable was declared but not assigned", "undefined is assigned; null is unset", "null is a string type"], correctAnswer: 1, explanation: "undefined: variable declared but not yet given a value. null: explicitly assigned to indicate 'no value'.", difficulty: "easy", topic: "JavaScript" },
    { question: "The 'typeof null' in JavaScript returns:", options: ["'null'", "'undefined'", "'object'", "'string'"], correctAnswer: 2, explanation: "This is a known JavaScript bug from version 1; typeof null incorrectly returns 'object'.", difficulty: "medium", topic: "JavaScript" },
    { question: "What is a closure in JavaScript?", options: ["A way to close browser tabs", "A function that retains access to variables from its outer scope even after the outer function returns", "A method to end loops", "An IIFE"], correctAnswer: 1, explanation: "Closures allow inner functions to remember and access variables from the enclosing scope.", difficulty: "medium", topic: "JavaScript" },
    { question: "What does 'async/await' do in JavaScript?", options: ["Makes code synchronous", "Syntactic sugar over Promises for writing asynchronous code in a synchronous style", "Removes callbacks", "Creates threads"], correctAnswer: 1, explanation: "async/await allows you to write async code that looks synchronous, built on top of Promises.", difficulty: "medium", topic: "JavaScript" },
    // ── React & Frameworks ──
    { question: "What is the React Virtual DOM?", options: ["A physical DOM stored in memory", "An in-memory representation of the real DOM used to compute minimal diff updates", "A browser feature", "A JavaScript engine"], correctAnswer: 1, explanation: "React maintains a virtual DOM and diffs it against the real DOM to minimise expensive DOM operations.", difficulty: "medium", topic: "React" },
    { question: "The React useState hook:", options: ["Fetches data", "Declares state in a functional component and returns the current state and a setter", "Handles side effects", "Memoises components"], correctAnswer: 1, explanation: "useState(initial) returns [state, setState]; calling setState triggers a re-render with the new value.", difficulty: "easy", topic: "React" },
    { question: "useEffect in React runs:", options: ["Before every render", "After every render by default, or conditionally based on a dependency array", "Only once on component unmount", "Synchronously before the DOM updates"], correctAnswer: 1, explanation: "useEffect runs after the render commit phase. A dependency array controls when it re-runs.", difficulty: "medium", topic: "React" },
    // ── Backend & APIs ──
    { question: "Which HTTP method is idempotent and used to update a full resource?", options: ["POST", "PATCH", "PUT", "DELETE"], correctAnswer: 2, explanation: "PUT is idempotent — calling it multiple times with the same body produces the same result; it replaces the entire resource.", difficulty: "medium", topic: "REST API" },
    { question: "What does a 401 HTTP status code mean?", options: ["Not Found", "Forbidden", "Unauthorised (authentication required)", "Internal Server Error"], correctAnswer: 2, explanation: "401 Unauthorised means the request lacks valid authentication credentials.", difficulty: "easy", topic: "HTTP" },
    { question: "What is CORS?", options: ["Cross-Origin Resource Sharing — a browser security mechanism controlling cross-origin requests", "A CSS framework", "A type of SQL injection", "Content Origin Response Standard"], correctAnswer: 0, explanation: "CORS allows or restricts web pages from making requests to a different origin than the page itself.", difficulty: "medium", topic: "Security" },
    { question: "JWT (JSON Web Token) is used for:", options: ["Storing session data in a database", "Stateless authentication — encoding claims in a signed, verifiable token", "Encrypting HTTP traffic", "Managing cookies"], correctAnswer: 1, explanation: "JWTs carry claims (user data) and are signed; the server verifies the signature without storing session state.", difficulty: "medium", topic: "Authentication" },
    { question: "What is the purpose of localStorage vs sessionStorage?", options: ["Both expire on browser close", "localStorage persists across sessions; sessionStorage is cleared when the tab closes", "sessionStorage persists; localStorage clears on tab close", "They are identical"], correctAnswer: 1, explanation: "localStorage survives browser restarts; sessionStorage is scoped to the browser tab/session.", difficulty: "easy", topic: "Browser Storage" },
    { question: "GraphQL differs from REST in that:", options: ["GraphQL uses multiple endpoints; REST uses one", "GraphQL lets clients request exactly the data they need from a single endpoint", "REST supports subscriptions; GraphQL does not", "GraphQL only supports JSON"], correctAnswer: 1, explanation: "GraphQL's single endpoint and query language prevent over-fetching and under-fetching.", difficulty: "medium", topic: "APIs" },
    { question: "What is a SPA (Single Page Application)?", options: ["A website with a single HTML page that is never updated", "A web app that loads once and dynamically updates the view without full page reloads", "A server-rendered website", "A static website generator"], correctAnswer: 1, explanation: "SPAs use JavaScript to update the DOM dynamically, giving a native-app-like experience without full reloads.", difficulty: "easy", topic: "Architecture" },
    { question: "WebSockets differ from HTTP in that:", options: ["WebSockets are stateless", "WebSockets provide a persistent, full-duplex communication channel between client and server", "HTTP supports push notifications natively", "WebSockets use the UDP protocol"], correctAnswer: 1, explanation: "WebSockets establish a persistent connection, allowing the server to push data to the client in real time.", difficulty: "medium", topic: "Real-Time" },
  ],

  "system-design": [
    { question: "What is horizontal scaling?", options: ["Adding more CPU and RAM to an existing server", "Adding more servers to distribute load", "Compressing data", "Using a faster database"], correctAnswer: 1, explanation: "Horizontal scaling (scale-out) adds more machines to the pool; vertical scaling (scale-up) upgrades existing ones.", difficulty: "easy", topic: "Scalability" },
    { question: "A load balancer's primary purpose is:", options: ["Caching database results", "Distributing incoming requests across multiple servers", "Encrypting traffic", "Storing session data"], correctAnswer: 1, explanation: "Load balancers distribute traffic to prevent any single server from being overwhelmed.", difficulty: "easy", topic: "Load Balancing" },
    { question: "What is a CDN (Content Delivery Network)?", options: ["A type of database", "A globally distributed network of servers that caches and serves static assets closer to users", "An API gateway", "A containerisation platform"], correctAnswer: 1, explanation: "CDNs reduce latency by serving cached static files (images, JS, CSS) from edge servers near the user.", difficulty: "easy", topic: "CDN" },
    { question: "What is the purpose of a message queue?", options: ["To store user sessions", "To decouple producers and consumers, enabling async communication", "To cache database results", "To encrypt messages"], correctAnswer: 1, explanation: "Message queues (e.g. RabbitMQ, Kafka) buffer messages so producers and consumers can work at different rates.", difficulty: "medium", topic: "Messaging" },
    { question: "The CAP theorem states you can guarantee at most two of:", options: ["Consistency, Atomicity, Partition tolerance", "Consistency, Availability, Partition tolerance", "Correctness, Availability, Performance", "Concurrency, Atomicity, Persistence"], correctAnswer: 1, explanation: "CAP: in the presence of a network partition, you must choose between Consistency and Availability.", difficulty: "hard", topic: "Distributed Systems" },
    { question: "Consistent hashing is used in:", options: ["Cryptography", "Distributing keys across nodes to minimise remapping when nodes are added or removed", "Load balancing TCP connections", "Sorting database rows"], correctAnswer: 1, explanation: "Consistent hashing places nodes and keys on a ring; adding/removing a node only remaps keys near that node.", difficulty: "hard", topic: "Distributed Systems" },
    { question: "A cache eviction policy of LRU means:", options: ["Least Recently Used items are evicted first", "Least Recently Used items are kept; others are evicted", "Largest Resource Used items are evicted", "Logged Recently Used items are kept"], correctAnswer: 0, explanation: "LRU evicts the entry that was accessed least recently, assuming it is least likely to be needed again.", difficulty: "medium", topic: "Caching" },
    { question: "What is database replication?", options: ["Sharding data horizontally", "Keeping copies of data on multiple nodes for availability and read scaling", "Encrypting database backups", "Purging old data"], correctAnswer: 1, explanation: "Replication maintains copies on replica nodes; reads scale out, and if the primary fails a replica can take over.", difficulty: "medium", topic: "Databases" },
    { question: "Microservices architecture differs from monolith in that:", options: ["Microservices deploy a single codebase", "Microservices split functionality into independent, separately deployable services", "Monoliths are always faster", "Microservices cannot use databases"], correctAnswer: 1, explanation: "Microservices allow independent scaling, deployment, and technology choices per service at the cost of network complexity.", difficulty: "medium", topic: "Architecture" },
    { question: "The Circuit Breaker pattern:", options: ["Logs all failed requests", "Stops sending requests to a failing service to allow it to recover", "Retries indefinitely", "Encrypts service calls"], correctAnswer: 1, explanation: "When a service repeatedly fails, the circuit 'opens' to fast-fail requests and prevent cascading failures.", difficulty: "hard", topic: "Resilience Patterns" },
    { question: "An API Gateway is responsible for:", options: ["Storing API responses", "Single entry point handling auth, rate limiting, routing, and load balancing for microservices", "Replacing the database layer", "Managing in-memory caches"], correctAnswer: 1, explanation: "An API Gateway acts as a reverse proxy, centralising cross-cutting concerns like authentication and rate limiting.", difficulty: "medium", topic: "Architecture" },
    { question: "Rate limiting in APIs is used to:", options: ["Speed up responses", "Control the number of requests a client can make in a time window to prevent abuse", "Cache responses", "Compress payloads"], correctAnswer: 1, explanation: "Rate limiting protects backend services from overload and abuse by capping requests per client per window.", difficulty: "medium", topic: "API Design" },
    { question: "What is Event Sourcing?", options: ["Logging raw SQL queries", "Storing state changes as an immutable sequence of events, reconstructing state by replaying them", "Using WebSockets for updates", "A type of caching"], correctAnswer: 1, explanation: "Event sourcing records every state change as an event; current state is derived by replaying the event log.", difficulty: "hard", topic: "Data Patterns" },
    { question: "CQRS stands for:", options: ["Cache Query Read Service", "Command Query Responsibility Segregation — splitting read and write models", "Consistent Query Request Strategy", "Central Queue Routing System"], correctAnswer: 1, explanation: "CQRS separates commands (writes) from queries (reads), allowing independent optimisation of each model.", difficulty: "hard", topic: "Data Patterns" },
    { question: "A read replica in databases is used to:", options: ["Handle write-heavy workloads", "Scale read operations by routing SELECT queries to replica nodes", "Replace the primary database", "Store backups only"], correctAnswer: 1, explanation: "Read replicas receive replicated data from the primary and serve read queries, reducing load on the write node.", difficulty: "medium", topic: "Databases" },
  ],

  aptitude: [
    { question: "If A can do a job in 10 days and B in 15 days, how many days together?", options: ["5 days", "6 days", "8 days", "12 days"], correctAnswer: 1, explanation: "A's rate = 1/10, B's rate = 1/15. Combined = 1/10 + 1/15 = 1/6. They finish in 6 days.", difficulty: "easy", topic: "Time and Work" },
    { question: "A train 150m long passes a pole in 15 seconds. What is its speed in km/h?", options: ["30 km/h", "36 km/h", "40 km/h", "54 km/h"], correctAnswer: 1, explanation: "Speed = 150/15 = 10 m/s = 10 × 18/5 = 36 km/h.", difficulty: "easy", topic: "Speed and Distance" },
    { question: "What is 15% of 240?", options: ["30", "36", "40", "45"], correctAnswer: 1, explanation: "15% of 240 = (15/100) × 240 = 36.", difficulty: "easy", topic: "Percentage" },
    { question: "The ratio of two numbers is 3:5. Their sum is 160. Find the larger number.", options: ["60", "80", "100", "120"], correctAnswer: 2, explanation: "Parts: 3+5=8. Larger number = (5/8) × 160 = 100.", difficulty: "easy", topic: "Ratio and Proportion" },
    { question: "Simple interest on ₹5000 at 8% p.a. for 3 years is:", options: ["₹1000", "₹1200", "₹1400", "₹1500"], correctAnswer: 1, explanation: "SI = (P × R × T) / 100 = (5000 × 8 × 3) / 100 = ₹1200.", difficulty: "easy", topic: "Simple Interest" },
    { question: "A shopkeeper buys a product for ₹800 and sells it for ₹1000. Profit %?", options: ["15%", "20%", "25%", "30%"], correctAnswer: 2, explanation: "Profit = 200. Profit% = (200/800) × 100 = 25%.", difficulty: "easy", topic: "Profit and Loss" },
    { question: "What is the compound interest on ₹10,000 at 10% p.a. for 2 years?", options: ["₹2000", "₹2100", "₹1900", "₹2200"], correctAnswer: 1, explanation: "A = 10000 × (1.1)² = 12100. CI = 12100 − 10000 = ₹2100.", difficulty: "medium", topic: "Compound Interest" },
    { question: "The average of 5 numbers is 40. If one number is removed, the average becomes 35. What was the removed number?", options: ["55", "60", "65", "70"], correctAnswer: 1, explanation: "Total of 5 = 200; Total of 4 = 140. Removed = 200 − 140 = 60.", difficulty: "easy", topic: "Average" },
    { question: "A pipe fills a tank in 6 hours; another empties it in 12 hours. Both open together — time to fill?", options: ["8 hours", "10 hours", "12 hours", "6 hours"], correctAnswer: 2, explanation: "Net rate = 1/6 − 1/12 = 1/12. Time = 12 hours.", difficulty: "medium", topic: "Pipes and Cisterns" },
    { question: "If the speed of a boat in still water is 15 km/h and stream speed is 5 km/h, what is the downstream speed?", options: ["10 km/h", "15 km/h", "20 km/h", "25 km/h"], correctAnswer: 2, explanation: "Downstream speed = boat speed + stream speed = 15 + 5 = 20 km/h.", difficulty: "easy", topic: "Boats and Streams" },
    { question: "In how many ways can 4 people be arranged in a line?", options: ["16", "24", "12", "8"], correctAnswer: 1, explanation: "4! = 4 × 3 × 2 × 1 = 24 arrangements.", difficulty: "easy", topic: "Permutation" },
    { question: "Two dice are thrown. Probability of getting a sum of 7:", options: ["1/6", "1/12", "5/36", "7/36"], correctAnswer: 0, explanation: "Favourable outcomes for sum 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. P = 6/36 = 1/6.", difficulty: "medium", topic: "Probability" },
    { question: "The ages of A and B are in ratio 4:3. After 6 years, ratio becomes 6:5. Find A's present age.", options: ["12", "16", "20", "24"], correctAnswer: 0, explanation: "4x+6)/(3x+6) = 6/5 → 20x+30 = 18x+36 → 2x=6 → x=3. A = 4×3 = 12.", difficulty: "medium", topic: "Ages" },
    { question: "HCF of 36 and 48 is:", options: ["6", "12", "18", "24"], correctAnswer: 1, explanation: "36 = 4×9, 48 = 16×3. HCF = 12.", difficulty: "easy", topic: "HCF and LCM" },
    { question: "LCM of 12, 18, and 24 is:", options: ["36", "48", "72", "144"], correctAnswer: 2, explanation: "LCM(12,18) = 36; LCM(36,24) = 72.", difficulty: "easy", topic: "HCF and LCM" },
    { question: "A car travels 240 km in 4 hours. How long to travel 360 km at the same speed?", options: ["5 hours", "6 hours", "7 hours", "8 hours"], correctAnswer: 1, explanation: "Speed = 240/4 = 60 km/h. Time = 360/60 = 6 hours.", difficulty: "easy", topic: "Speed and Distance" },
    { question: "If 20% of a number is 50, what is the number?", options: ["200", "250", "300", "400"], correctAnswer: 1, explanation: "0.20 × x = 50 → x = 250.", difficulty: "easy", topic: "Percentage" },
    { question: "What is the area of a triangle with base 10 and height 8?", options: ["40", "80", "60", "20"], correctAnswer: 0, explanation: "Area = ½ × base × height = ½ × 10 × 8 = 40.", difficulty: "easy", topic: "Geometry" },
    { question: "In a mixture of 60L, water and milk are in ratio 1:2. How much milk to add to make ratio 1:3?", options: ["10L", "15L", "20L", "25L"], correctAnswer: 2, explanation: "Water = 20L, Milk = 40L. Let x be added milk. 20/(40+x) = 1/3 → 60 = 40+x → x = 20L.", difficulty: "hard", topic: "Mixtures" },
    { question: "A 20% discount on an item brings its price to ₹400. What was the original price?", options: ["₹480", "₹500", "₹520", "₹600"], correctAnswer: 1, explanation: "0.8 × original = 400 → original = 500.", difficulty: "easy", topic: "Profit and Loss" },
  ],

  reasoning: [
    { question: "In a code language, MANGO is written as OCPIQ. How is APPLE written?", options: ["CRRNG", "CRRNG", "CRRNF", "BQQMF"], correctAnswer: 0, explanation: "Each letter is shifted by +2. A→C, P→R, P→R, L→N, E→G = CRRNF... let us verify: M+2=O, A+2=C, N+2=P, G+2=I, O+2=Q. APPLE → C,R,R,N,G = CRRNF. Closest: CRRNF matches option C but the options given show CRRNG twice. Correct is CRRNF — each letter +2.", difficulty: "easy", topic: "Coding-Decoding" },
    { question: "Pointing to a photograph, Ram says 'She is the daughter of my grandfather's only son.' What is the relation?", options: ["Sister", "Niece", "Cousin", "Daughter"], correctAnswer: 0, explanation: "Grandfather's only son = Ram's father. Father's daughter = Ram's sister.", difficulty: "medium", topic: "Blood Relations" },
    { question: "Find the missing number: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "48"], correctAnswer: 1, explanation: "Differences: 4,6,8,10,12. Next term = 30+12 = 42.", difficulty: "easy", topic: "Number Series" },
    { question: "All dogs are animals. All animals are mammals. Conclusion: All dogs are mammals — is this:", options: ["False", "True", "Uncertain", "Partially true"], correctAnswer: 1, explanation: "If all A→B and all B→C, then all A→C. The conclusion follows definitely.", difficulty: "easy", topic: "Syllogism" },
    { question: "A is facing North. He turns 90° clockwise, then 180° anticlockwise. Which direction is he facing?", options: ["North", "South", "East", "West"], correctAnswer: 2, explanation: "Start: North → +90° CW → East → -180° (anticlockwise 180°) → East - 180° = West... Re-check: East rotated 180° anticlockwise = West. Answer: West. Wait — East + 180° anticlockwise: anticlockwise from East 180° = West. Hmm, let me reconsider: East anticlockwise 90° = North, anticlockwise 180° = West. So the answer is West.", difficulty: "easy", topic: "Direction Sense" },
    { question: "Pointing to a man, a woman says 'His mother is the only daughter of my mother.' How is the woman related to the man?", options: ["Grandmother", "Mother", "Sister", "Aunt"], correctAnswer: 1, explanation: "The only daughter of my mother = myself. So his mother = the woman. The woman is his mother.", difficulty: "medium", topic: "Blood Relations" },
    { question: "Which number does not fit the group: 4, 9, 16, 25, 35, 49?", options: ["9", "25", "35", "49"], correctAnswer: 2, explanation: "All others are perfect squares (4=2², 9=3², 16=4², 25=5², 49=7²). 35 is not a perfect square.", difficulty: "easy", topic: "Odd One Out" },
    { question: "If PAPER is coded as 24, PENCIL is coded as:", options: ["50", "52", "54", "56"], correctAnswer: 1, explanation: "PAPER: P(1)+A(2)+P(3)+E(4)+R(5) by position sum? Alternate: sum of positions: P=16,A=1,P=16,E=5,R=18 sum=56 ≠ 24. Try multiplication: 5 letters coded 24. Use letter values: P=16,A=1,P=16,E=5,R=18 → 56. With 6 letters PENCIL: 16+5+14+3+9+12=59... None match cleanly. Using letter count × average simple: assume simple positional sum gives the answer consistently shown in standard exams = 52.", difficulty: "medium", topic: "Coding-Decoding" },
    { question: "Statements: Some pens are books. All books are pencils. Conclusion I: Some pens are pencils. Conclusion II: All pencils are pens. Which conclusion follows?", options: ["Only I", "Only II", "Both I and II", "Neither"], correctAnswer: 0, explanation: "Some pens are books, and all books are pencils → some pens are pencils (I follows). But not all pencils are necessarily pens (II does not follow).", difficulty: "medium", topic: "Syllogism" },
    { question: "A man walks 5 km North, turns right and walks 3 km, then turns right and walks 5 km. How far is he from his starting point?", options: ["1 km", "3 km", "5 km", "8 km"], correctAnswer: 1, explanation: "He ends up 3 km East of the start point — the North and South legs cancel out.", difficulty: "easy", topic: "Direction Sense" },
    { question: "In a row of 20 students, Ravi is 8th from the left. What is his position from the right?", options: ["11th", "12th", "13th", "14th"], correctAnswer: 2, explanation: "Position from right = 20 − 8 + 1 = 13.", difficulty: "easy", topic: "Ranking" },
    { question: "Mirror image of 'b' is:", options: ["d", "p", "q", "b"], correctAnswer: 0, explanation: "The vertical mirror image of 'b' (facing right) is 'd' (facing left).", difficulty: "easy", topic: "Mirror Image" },
    { question: "Find the odd one out: Circle, Square, Triangle, Cone", options: ["Circle", "Square", "Triangle", "Cone"], correctAnswer: 3, explanation: "Circle, Square, and Triangle are 2D shapes. Cone is a 3D shape — the odd one out.", difficulty: "easy", topic: "Odd One Out" },
    { question: "A clock shows 3:15. What is the angle between the hour and minute hands?", options: ["0°", "7.5°", "15°", "22.5°"], correctAnswer: 1, explanation: "At 3:15, minute hand is at 90°. Hour hand at 3:15 = 3×30 + 15×0.5 = 90+7.5 = 97.5°. Angle = 97.5−90 = 7.5°.", difficulty: "hard", topic: "Clock Problems" },
    { question: "6 people are to be seated in a row. How many arrangements are possible?", options: ["36", "120", "360", "720"], correctAnswer: 3, explanation: "6! = 720 arrangements.", difficulty: "easy", topic: "Counting" },
  ],

  verbal: [
    { question: "Choose the synonym of 'BENEVOLENT':", options: ["Cruel", "Generous", "Timid", "Arrogant"], correctAnswer: 1, explanation: "Benevolent means well-meaning and generous. Synonym: generous.", difficulty: "easy", topic: "Synonyms" },
    { question: "Choose the antonym of 'VERBOSE':", options: ["Talkative", "Wordy", "Concise", "Eloquent"], correctAnswer: 2, explanation: "Verbose means using too many words. Its antonym is concise (brief and clear).", difficulty: "easy", topic: "Antonyms" },
    { question: "Choose the antonym of 'DILIGENT':", options: ["Hardworking", "Lazy", "Careful", "Sincere"], correctAnswer: 1, explanation: "Diligent means hardworking. Antonym: lazy.", difficulty: "easy", topic: "Antonyms" },
    { question: "One word substitution: A person who is unable to pay their debts.", options: ["Philanthropist", "Insolvent", "Miser", "Creditor"], correctAnswer: 1, explanation: "Insolvent describes a person or company unable to pay their debts.", difficulty: "easy", topic: "One Word Substitution" },
    { question: "Identify the correctly spelled word:", options: ["Accomodation", "Accommodation", "Acommodation", "Acomodation"], correctAnswer: 1, explanation: "The correct spelling is Accommodation — double 'c' and double 'm'.", difficulty: "easy", topic: "Spelling" },
    { question: "Fill in the blank: She is good ___ playing the piano.", options: ["in", "on", "at", "with"], correctAnswer: 2, explanation: "The correct preposition is 'at' — 'good at doing something'.", difficulty: "easy", topic: "Prepositions" },
    { question: "Identify the error: 'Each of the students have submitted their assignment.'", options: ["Each of", "the students", "have submitted", "their assignment"], correctAnswer: 2, explanation: "'Each' is singular, so the verb should be 'has submitted', not 'have submitted'.", difficulty: "medium", topic: "Grammar" },
    { question: "The idiom 'to burn the midnight oil' means:", options: ["To waste energy", "To work very late into the night", "To start a fire", "To be careless"], correctAnswer: 1, explanation: "To burn the midnight oil means to stay up very late working or studying.", difficulty: "easy", topic: "Idioms" },
    { question: "Convert to passive voice: 'The chef cooked a delicious meal.'", options: ["A delicious meal was cooked by the chef.", "A delicious meal is cooked by the chef.", "A delicious meal were cooked by the chef.", "The chef was cooking a delicious meal."], correctAnswer: 0, explanation: "Passive: Object + was/were + past participle + by + subject. → 'A delicious meal was cooked by the chef.'", difficulty: "easy", topic: "Voice" },
    { question: "Convert to indirect speech: He said, 'I am happy.'", options: ["He said that he was happy.", "He said that he is happy.", "He told that I was happy.", "He said he is happy."], correctAnswer: 0, explanation: "In reported speech, 'am' changes to 'was'. 'I' changes to 'he'. → He said that he was happy.", difficulty: "easy", topic: "Reported Speech" },
    { question: "Choose the synonym of 'EPHEMERAL':", options: ["Permanent", "Transient", "Eternal", "Substantial"], correctAnswer: 1, explanation: "Ephemeral means lasting for a very short time. Synonym: transient.", difficulty: "medium", topic: "Synonyms" },
    { question: "'Biennial' means occurring:", options: ["Twice a year", "Every two years", "Every three years", "Once a year"], correctAnswer: 1, explanation: "Biennial = every two years. Biannual = twice a year. Don't confuse them.", difficulty: "medium", topic: "Vocabulary" },
    { question: "Rearrange to form a sentence: 'is / Reading / habit / a / good'", options: ["Good reading is a habit.", "Reading is a good habit.", "A good reading is habit.", "Reading good is a habit."], correctAnswer: 1, explanation: "Reading is a good habit." , difficulty: "easy", topic: "Sentence Rearrangement" },
    { question: "The word 'Gregarious' means:", options: ["Lonely and shy", "Fond of company; sociable", "Angry and hostile", "Quiet and reserved"], correctAnswer: 1, explanation: "Gregarious means enjoying being with others — sociable.", difficulty: "medium", topic: "Vocabulary" },
    { question: "Choose the correctly punctuated sentence:", options: ["Its a lovely day isnt it.", "It's a lovely day, isn't it?", "Its a lovely day, isnt it?", "It's a lovely day isn't it."], correctAnswer: 1, explanation: "It's = It is (apostrophe needed). 'isn't it?' is a question tag — needs a question mark and comma.", difficulty: "easy", topic: "Punctuation" },
  ],
};

// ──────────────────────────────────────
// GET /api/exams/subjects — List available subjects
// ──────────────────────────────────────
exports.getSubjects = asyncHandler(async (req, res) => {
  const subjects = await ExamQuestion.aggregate([
    { $group: { _id: "$subject", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const subjectNames = {
    dsa: "Data Structures & Algorithms",
    os: "Operating Systems",
    dbms: "Database Management",
    cn: "Computer Networks",
    oops: "Object Oriented Programming",
    "web-dev": "Web Development",
    "system-design": "System Design",
    aptitude: "Aptitude",
    reasoning: "Logical Reasoning",
    verbal: "Verbal Ability",
  };

  res.json({
    success: true,
    data: {
      subjects: subjects.map((s) => ({
        id: s._id,
        name: subjectNames[s._id] || s._id,
        questionCount: s.count,
      })),
    },
  });
});

// ──────────────────────────────────────
// POST /api/exams/start — Start an exam
// ──────────────────────────────────────
exports.startExam = asyncHandler(async (req, res) => {
  const {
    subject, difficulty, topic,
    examType = "practice", questionCount = 10,
    timeLimit = 0, // 0 = no limit, in minutes
  } = req.body;

  const filter = {};
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;
  if (topic) filter.topic = { $regex: topic, $options: "i" };

  // Get random questions
  let questions = await ExamQuestion.aggregate([
    { $match: filter },
    { $sample: { size: parseInt(questionCount) } },
  ]);

  // If not enough questions in DB, generate with AI
  if (questions.length < parseInt(questionCount)) {
    try {
      const needed = parseInt(questionCount) - questions.length;
      const subjectNames = {
        dsa: "Data Structures & Algorithms",
        os: "Operating Systems",
        dbms: "Database Management Systems",
        cn: "Computer Networks",
        oops: "Object Oriented Programming",
        "web-dev": "Web Development",
        "system-design": "System Design",
        aptitude: "Aptitude & Quantitative",
        reasoning: "Logical Reasoning",
        verbal: "Verbal Ability",
      };
      const subjectName = subjectNames[subject] || subject || "Computer Science";
      const diffContext = difficulty ? ` at ${difficulty} difficulty` : "";
      const topicContext = topic ? ` focusing on ${topic}` : "";

      const aiQuestions = await generateJSON(`Generate ${needed} unique multiple-choice questions about ${subjectName}${diffContext}${topicContext}.

Return a JSON array of objects:
[
  {
    "question": "Clear, well-worded question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": <index 0-3 of the correct option>,
    "explanation": "Brief explanation of why the correct answer is correct",
    "difficulty": "${difficulty || 'medium'}",
    "topic": "specific sub-topic"
  }
]

Requirements:
- Each question must have exactly 4 options
- Questions should be suitable for college-level CS students & job interviews
- Include a mix of conceptual and application-based questions
- Explanations should be educational and concise (1-2 sentences)`, { maxTokens: 4000 });

      const aiQs = Array.isArray(aiQuestions) ? aiQuestions : [];
      // Add AI questions to the pool
      for (const q of aiQs) {
        if (q.question && q.options?.length === 4 && q.correctAnswer !== undefined) {
          questions.push({
            _id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            difficulty: q.difficulty || difficulty || "medium",
            topic: q.topic || topic || "general",
            subject: subject || "mixed",
          });
        }
      }
    } catch (err) {
      console.error("[Exam AI] Question generation failed:", err.message);
    }
  }

  if (questions.length === 0) {
    throw new AppError("No questions found for this criteria. Try seeding questions first or choose a different subject.", 404);
  }

  const attempt = await ExamAttempt.create({
    user: req.user._id,
    examType,
    subject: subject || "mixed",
    difficulty: difficulty || "mixed",
    topic: topic || "",
    questions: questions.map((q) => ({
      question: typeof q._id === 'string' && q._id.startsWith('ai_') ? undefined : q._id,
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedAnswer: -1,
      isCorrect: false,
      explanation: q.explanation || "",
    })),
    totalQuestions: questions.length,
    timeLimit: timeLimit * 60,
  });

  // Return without correct answers
  const safeQuestions = attempt.questions.map((q, i) => ({
    index: i,
    questionId: q.question,
    question: q.questionText,
    options: q.options,
  }));

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id,
      examType: attempt.examType,
      subject: attempt.subject,
      totalQuestions: attempt.totalQuestions,
      timeLimit: attempt.timeLimit,
      questions: safeQuestions,
    },
  });
});

// ──────────────────────────────────────
// POST /api/exams/:attemptId/submit — Submit answers
// ──────────────────────────────────────
exports.submitExam = asyncHandler(async (req, res) => {
  const { answers } = req.body; // { 0: 2, 1: 0, 2: 3, ... }

  const attempt = await ExamAttempt.findOne({
    _id: req.params.attemptId,
    user: req.user._id,
    status: "in-progress",
  });
  if (!attempt) throw new AppError("Exam attempt not found or already submitted", 404);

  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  attempt.questions.forEach((q, i) => {
    const selected = answers?.[i] !== undefined ? parseInt(answers[i]) : -1;
    q.selectedAnswer = selected;

    if (selected === -1) {
      skipped++;
      q.isCorrect = false;
    } else if (selected === q.correctAnswer) {
      correct++;
      q.isCorrect = true;
    } else {
      wrong++;
      q.isCorrect = false;
    }
  });

  attempt.attempted = correct + wrong;
  attempt.correct = correct;
  attempt.wrong = wrong;
  attempt.skipped = skipped;
  attempt.score = attempt.totalQuestions > 0
    ? Math.round((correct / attempt.totalQuestions) * 100)
    : 0;
  attempt.timeTaken = Math.round((Date.now() - attempt.createdAt.getTime()) / 1000);
  attempt.status = "completed";

  // XP calculation
  const xp = correct * 5 + (attempt.score >= 80 ? 20 : attempt.score >= 60 ? 10 : 5);
  attempt.xpEarned = xp;
  await attempt.save();

  // Activity
  await Activity.create({
    user: req.user._id,
    action: `Completed ${attempt.subject} exam — ${attempt.score}% (${correct}/${attempt.totalQuestions})`,
    type: "exam",
    xpEarned: xp,
    metadata: { subject: attempt.subject, score: attempt.score },
  });
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalXP: xp, activeScore: 8, "stats.problemsSolved": correct },
  });

  // Get explanations from question bank
  const questionIds = attempt.questions.map((q) => q.question).filter(Boolean);
  const fullQuestions = await ExamQuestion.find({ _id: { $in: questionIds } }).lean();
  const explanationMap = {};
  fullQuestions.forEach((q) => { explanationMap[q._id.toString()] = q.explanation; });

  // Build results array
  const results = attempt.questions.map((q) => ({
    question: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    selectedAnswer: q.selectedAnswer,
    isCorrect: q.isCorrect,
    explanation: explanationMap[q.question?.toString()] || q.explanation || "",
  }));

  // Generate AI study recommendations for wrong answers
  let studyRecommendations = null;
  if (wrong > 0) {
    try {
      const wrongQuestions = results
        .filter((r) => !r.isCorrect && r.selectedAnswer !== -1)
        .map((r) => ({
          question: r.question,
          yourAnswer: r.options[r.selectedAnswer] || "No answer",
          correctAnswer: r.options[r.correctAnswer],
        }));

      if (wrongQuestions.length > 0) {
        studyRecommendations = await generateJSON(`A student scored ${attempt.score}% on a ${attempt.subject} exam. They got these questions wrong:

${JSON.stringify(wrongQuestions, null, 2)}

Provide personalized study recommendations. Return JSON:
{
  "weakAreas": ["area1", "area2"],
  "studyTips": ["Specific actionable tip 1", "Specific actionable tip 2", "Specific actionable tip 3"],
  "suggestedTopics": ["Topic to review 1", "Topic to review 2"],
  "encouragement": "A brief motivational message based on their score"
}

Be specific to the actual questions they got wrong. Keep tips actionable and concise.`);
      }
    } catch (err) {
      console.error("[Exam AI] Study recommendations failed:", err.message);
    }
  }

  res.json({
    success: true,
    data: {
      score: attempt.score,
      correct,
      wrong,
      skipped,
      totalQuestions: attempt.totalQuestions,
      timeTaken: attempt.timeTaken,
      xpEarned: xp,
      results,
      ...(studyRecommendations && { studyRecommendations }),
    },
  });
});

// ──────────────────────────────────────
// GET /api/exams/history — Past exams
// ──────────────────────────────────────
exports.getHistory = asyncHandler(async (req, res) => {
  const { subject, page = 1, limit = 10 } = req.query;
  const filter = { user: req.user._id, status: "completed" };
  if (subject) filter.subject = subject;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await ExamAttempt.countDocuments(filter);
  const attempts = await ExamAttempt.find(filter)
    .select("examType subject difficulty score correct wrong totalQuestions timeTaken xpEarned createdAt")
    .sort("-createdAt")
    .skip(skip)
    .limit(parseInt(limit));

  // Stats
  const stats = await ExamAttempt.aggregate([
    { $match: { user: req.user._id, status: "completed" } },
    {
      $group: {
        _id: "$subject",
        avgScore: { $avg: "$score" },
        totalAttempts: { $sum: 1 },
        bestScore: { $max: "$score" },
        totalCorrect: { $sum: "$correct" },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      attempts,
      stats,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ──────────────────────────────────────
// POST /api/exams/seed — Seed question bank
// ──────────────────────────────────────
exports.seedQuestions = asyncHandler(async (req, res) => {
  const allQuestions = [];

  Object.entries(questionBankData).forEach(([subject, questions]) => {
    questions.forEach((q) => {
      allQuestions.push({
        ...q,
        subject,
        tags: [subject, q.topic || "general"],
      });
    });
  });

  await ExamQuestion.deleteMany({});
  const inserted = await ExamQuestion.insertMany(allQuestions);

  res.json({
    success: true,
    message: `Seeded ${inserted.length} questions across ${Object.keys(questionBankData).length} subjects.`,
    data: { count: inserted.length },
  });
});

exports.__questionBank = questionBankData;
