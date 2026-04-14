# Dynamic Programming — Interview Question Bank

---

## 1. 1D Linear DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Climbing Stairs | 70 | Easy |
| 2 | House Robber | 198 | Medium |
| 3 | House Robber II (circular) | 213 | Medium |
| 4 | Decode Ways | 91 | Medium |
| 5 | Word Break | 139 | Medium |
| 6 | Word Break II | 140 | Hard |
| 7 | Jump Game | 55 | Medium |
| 8 | Jump Game II | 45 | Medium |
| 9 | Minimum Cost for Tickets | 983 | Medium |
| 10 | Integer Break | 343 | Medium |
| 11 | Perfect Squares | 279 | Medium |
| 12 | Ugly Number II | 264 | Medium |
| 13 | Super Ugly Number | 313 | Medium |
| 14 | Count Sorted Vowel Strings | 1641 | Medium |
| 15 | Delete and Earn | 740 | Medium |
| 16 | Domino and Tromino Tiling | 790 | Medium |
| 17 | Filling Bookcase Shelves | 1105 | Medium |
| 18 | Minimum Cost to Cut a Stick | 1547 | Hard |
| 19 | Extra Characters in a String | 2707 | Medium |
| 20 | Solving Questions with Brainpower | 2140 | Medium |

### Key Solutions

**Climbing Stairs (LC 70)**
*Idea:* Fibonacci — at each step you can come from step i-1 or i-2.
```
dp[0] = 1, dp[1] = 1
for i = 2 to n:
    dp[i] = dp[i-1] + dp[i-2]
return dp[n]
```
Time: O(n), Space: O(1) with two variables.

---

**House Robber (LC 198)**
*Idea:* At each house, either rob it (add to dp[i-2]) or skip it (take dp[i-1]).
```
dp[0] = nums[0]
dp[1] = max(nums[0], nums[1])
for i = 2 to n-1:
    dp[i] = max(dp[i-1], dp[i-2] + nums[i])
return dp[n-1]
```
Time: O(n), Space: O(1).

---

**House Robber II (LC 213)**
*Idea:* Circular array — run House Robber on nums[0..n-2] and nums[1..n-1], take the max.
```
return max(robLinear(nums[0..n-2]), robLinear(nums[1..n-1]))
```

---

**Decode Ways (LC 91)**
*Idea:* At position i, single digit (1-9) adds dp[i-1]; two digits (10-26) adds dp[i-2].
```
dp[0] = 1
dp[1] = 1 if s[0] != '0' else 0
for i = 2 to n:
    if s[i-1] != '0': dp[i] += dp[i-1]
    two = int(s[i-2..i-1])
    if 10 <= two <= 26: dp[i] += dp[i-2]
return dp[n]
```

---

**Word Break (LC 139)**
*Idea:* dp[i] = true if s[0..i-1] can be segmented. Try every word in dict ending at position i.
```
dp[0] = true
for i = 1 to n:
    for word in wordDict:
        if i >= len(word) and dp[i - len(word)] and s[i-len(word)..i-1] == word:
            dp[i] = true; break
return dp[n]
```

---

**Jump Game (LC 55)**
*Idea:* Track the farthest reachable index greedily.
```
maxReach = 0
for i = 0 to n-1:
    if i > maxReach: return false
    maxReach = max(maxReach, i + nums[i])
return true
```

---

**Jump Game II (LC 45)**
*Idea:* BFS-style greedy — track current level end and farthest reachable.
```
jumps = 0, curEnd = 0, farthest = 0
for i = 0 to n-2:
    farthest = max(farthest, i + nums[i])
    if i == curEnd:
        jumps++
        curEnd = farthest
return jumps
```

---

**Delete and Earn (LC 740)**
*Idea:* Reduce to House Robber. Build array where earn[v] = v * count(v). Adjacent values can't both be picked.
```
maxVal = max(nums)
earn[0..maxVal] = 0
for x in nums: earn[x] += x
// run House Robber on earn[]
```

---

**Perfect Squares (LC 279)**
*Idea:* dp[i] = min squares summing to i.
```
dp[0] = 0
for i = 1 to n:
    dp[i] = INF
    for j = 1 while j*j <= i:
        dp[i] = min(dp[i], dp[i - j*j] + 1)
return dp[n]
```

---

**Extra Characters in a String (LC 2707)**
*Idea:* dp[i] = min extra chars for s[0..i-1]. Either skip s[i-1] or match a dictionary word ending at i.
```
dp[0] = 0
for i = 1 to n:
    dp[i] = dp[i-1] + 1  // skip char
    for word in dict:
        if s ends with word at position i:
            dp[i] = min(dp[i], dp[i - len(word)])
return dp[n]
```

---

**Word Break II (LC 140)**
*Idea:* First mark suffixes that can break, then DFS from each index with memo to build sentences only through valid suffixes.
```
good[n] = true
for i = n-1 downto 0:
    for w in wordSet:
        if s starts with w at i and good[i + len(w)]:
            good[i] = true
            break

dfs(i):
    if i == n: return [""]
    if memo[i] exists: return memo[i]
    ans = []
    for w in wordSet:
        if s starts with w at i and good[i + len(w)]:
            for tail in dfs(i + len(w)):
                ans.append(w if tail == "" else w + " " + tail)
    memo[i] = ans
    return ans
return dfs(0)
```
Time depends on output size; memo avoids recomputing suffixes.

---

**Minimum Cost for Tickets (LC 983)**
*Idea:* dp[i] = min cost to cover travel days from index i onward. Try each pass and jump to the next uncovered day.
```
dp[n] = 0
for i = n-1 downto 0:
    j1 = first index with days[j1] >= days[i] + 1
    j7 = first index with days[j7] >= days[i] + 7
    j30 = first index with days[j30] >= days[i] + 30
    dp[i] = min(costs[0] + dp[j1],
                costs[1] + dp[j7],
                costs[2] + dp[j30])
return dp[0]
```
Time: O(n log n) with binary search, or O(n) with moving pointers.

---

**Integer Break (LC 343)**
*Idea:* For every split i = j + (i-j), each side can either stay whole or use its best broken product.
```
dp[1] = 1
for i = 2 to n:
    for j = 1 to i-1:
        left = max(j, dp[j])
        right = max(i-j, dp[i-j])
        dp[i] = max(dp[i], left * right)
return dp[n]
```
Time: O(n^2), Space: O(n).

---

**Ugly Number II (LC 264)**
*Idea:* Generate ugly numbers in sorted order using three pointers for the next multiple of 2, 3, and 5.
```
ugly[0] = 1
i2 = i3 = i5 = 0
for i = 1 to n-1:
    next = min(ugly[i2] * 2, ugly[i3] * 3, ugly[i5] * 5)
    ugly[i] = next
    if next == ugly[i2] * 2: i2++
    if next == ugly[i3] * 3: i3++
    if next == ugly[i5] * 5: i5++
return ugly[n-1]
```
Time: O(n), Space: O(n).

---

**Super Ugly Number (LC 313)**
*Idea:* Generalize Ugly Number II to k primes, with one pointer per prime.
```
ugly[0] = 1
idx[0..k-1] = 0
for i = 1 to n-1:
    next = min(primes[p] * ugly[idx[p]] for p = 0..k-1)
    ugly[i] = next
    for p = 0 to k-1:
        if primes[p] * ugly[idx[p]] == next:
            idx[p]++
return ugly[n-1]
```
Time: O(nk), Space: O(n + k).

---

**Count Sorted Vowel Strings (LC 1641)**
*Idea:* dp[v] = number of sorted strings of current length starting at vowel v or later.
```
dp[0..4] = 1
for len = 2 to n:
    for v = 3 downto 0:
        dp[v] += dp[v+1]
return sum(dp)
```
Time: O(5n), Space: O(1). Also equals C(n+4, 4).

---

**Filling Bookcase Shelves (LC 1105)**
*Idea:* dp[i] = min height for first i books. Build the last shelf by scanning backward until width overflows.
```
dp[0] = 0
for i = 1 to n:
    width = 0
    height = 0
    dp[i] = INF
    for j = i downto 1:
        width += books[j-1].width
        if width > shelfWidth: break
        height = max(height, books[j-1].height)
        dp[i] = min(dp[i], dp[j-1] + height)
return dp[n]
```
Time: O(n^2), Space: O(n).

---

**Solving Questions with Brainpower (LC 2140)**
*Idea:* Scan backward. At question i, either skip it or solve it and jump past its brainpower cooldown.
```
dp[n] = 0
for i = n-1 downto 0:
    skip = dp[i+1]
    next = min(n, i + questions[i].brainpower + 1)
    take = questions[i].points + dp[next]
    dp[i] = max(skip, take)
return dp[0]
```
Time: O(n), Space: O(n).

---

## 2. 2D Grid / Matrix DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Unique Paths | 62 | Medium |
| 2 | Unique Paths II (obstacles) | 63 | Medium |
| 3 | Minimum Path Sum | 64 | Medium |
| 4 | Triangle | 120 | Medium |
| 5 | Maximal Square | 221 | Medium |
| 6 | Maximal Rectangle | 85 | Hard |
| 7 | Dungeon Game | 174 | Hard |
| 8 | Cherry Pickup | 741 | Hard |
| 9 | Cherry Pickup II (two robots) | 1463 | Hard |
| 10 | Minimum Falling Path Sum | 931 | Medium |
| 11 | Minimum Falling Path Sum II | 1289 | Hard |
| 12 | Count Square Submatrices with All Ones | 1277 | Medium |
| 13 | Out of Boundary Paths | 576 | Medium |
| 14 | Knight Probability in Chessboard | 688 | Medium |
| 15 | Paths in Matrix Whose Sum Is Divisible by K | 2435 | Hard |

### Key Solutions

**Unique Paths (LC 62)**
*Idea:* dp[i][j] = paths to reach cell (i,j) from (0,0). Can only move right or down.
```
dp[i][j] = 1 for first row and first column
for i = 1 to m-1:
    for j = 1 to n-1:
        dp[i][j] = dp[i-1][j] + dp[i][j-1]
return dp[m-1][n-1]
```
Also solvable as C(m+n-2, m-1).

---

**Minimum Path Sum (LC 64)**
*Idea:* dp[i][j] = min cost to reach (i,j).
```
dp[0][0] = grid[0][0]
fill first row/col cumulatively
for i = 1 to m-1:
    for j = 1 to n-1:
        dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])
return dp[m-1][n-1]
```

---

**Maximal Square (LC 221)**
*Idea:* dp[i][j] = side length of largest square with bottom-right at (i,j).
```
for i = 0 to m-1:
    for j = 0 to n-1:
        if matrix[i][j] == '1':
            if i == 0 or j == 0: dp[i][j] = 1
            else: dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1
            maxSide = max(maxSide, dp[i][j])
return maxSide * maxSide
```

---

**Dungeon Game (LC 174)**
*Idea:* Work backwards from bottom-right. dp[i][j] = min HP needed at (i,j).
```
dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1])
// fill last row and column backwards
for i = m-1 downto 0:
    for j = n-1 downto 0:
        minNext = min(dp[i+1][j], dp[i][j+1])
        dp[i][j] = max(1, minNext - dungeon[i][j])
return dp[0][0]
```

---

**Cherry Pickup II (LC 1463)**
*Idea:* Two robots start from top corners. Process row by row; state = (row, col1, col2).
```
dp[row][c1][c2] = max cherries from row to bottom
for row = m-1 downto 0:
    for c1 = 0 to n-1:
        for c2 = 0 to n-1:
            cherries = grid[row][c1] + (c1 != c2 ? grid[row][c2] : 0)
            best = 0
            for dc1 in {-1,0,1}:
                for dc2 in {-1,0,1}:
                    best = max(best, dp[row+1][c1+dc1][c2+dc2])
            dp[row][c1][c2] = cherries + best
return dp[0][0][n-1]
```

---

**Unique Paths II (LC 63)**
*Idea:* Same as Unique Paths, but obstacle cells contribute 0 paths.
```
dp[0][0] = 1 if obstacleGrid[0][0] == 0 else 0
for i = 0 to m-1:
    for j = 0 to n-1:
        if obstacleGrid[i][j] == 1:
            dp[i][j] = 0
        else if not (i == 0 and j == 0):
            dp[i][j] = (i > 0 ? dp[i-1][j] : 0) +
                       (j > 0 ? dp[i][j-1] : 0)
return dp[m-1][n-1]
```
Time: O(mn), Space: O(n) with rolling row.

---

**Triangle (LC 120)**
*Idea:* Bottom-up DP. Collapse the triangle into a 1D array where dp[c] is the best path from the row below.
```
dp = copy of last row
for r = n-2 downto 0:
    for c = 0 to r:
        dp[c] = triangle[r][c] + min(dp[c], dp[c+1])
return dp[0]
```
Time: O(total cells), Space: O(n).

---

**Maximal Rectangle (LC 85)**
*Idea:* Convert each row into a histogram of consecutive 1s above it, then solve Largest Rectangle in Histogram.
```
heights[0..n-1] = 0
best = 0
for each row:
    for j = 0 to n-1:
        heights[j] = heights[j] + 1 if row[j] == '1' else 0
    best = max(best, largestRectangleArea(heights))
return best
```
Time: O(mn), Space: O(n).

---

**Cherry Pickup (LC 741)**
*Idea:* Model the round trip as two people walking from top-left to bottom-right at the same time. At step k, columns are derived from rows.
```
dp[k][r1][r2] = max cherries after k moves
for k = 0 to 2n-2:
    for r1 = max(0, k-(n-1)) to min(n-1, k):
        c1 = k - r1
        for r2 = max(0, k-(n-1)) to min(n-1, k):
            c2 = k - r2
            if grid[r1][c1] == -1 or grid[r2][c2] == -1: continue
            gain = grid[r1][c1] + (0 if r1 == r2 else grid[r2][c2])
            dp[k][r1][r2] = gain + max(previous 4 states)
return max(0, dp[2n-2][n-1][n-1])
```
Time: O(n^3), Space: O(n^2) with rolling steps.

---

**Minimum Falling Path Sum (LC 931)**
*Idea:* dp[j] = min path sum reaching column j in the previous row.
```
dp = first row
for i = 1 to n-1:
    next[0..n-1] = INF
    for j = 0 to n-1:
        next[j] = matrix[i][j] + min(dp[j],
                                     j > 0 ? dp[j-1] : INF,
                                     j+1 < n ? dp[j+1] : INF)
    dp = next
return min(dp)
```
Time: O(n^2), Space: O(n).

---

**Minimum Falling Path Sum II (LC 1289)**
*Idea:* For each row, keep the smallest and second smallest values from the previous row so the same column can be excluded in O(1).
```
min1 = 0, min2 = 0, idx1 = -1
for row in grid:
    curMin1 = INF, curMin2 = INF, curIdx1 = -1
    for j = 0 to n-1:
        bestPrev = min2 if j == idx1 else min1
        val = row[j] + bestPrev
        update current smallest and second smallest with val
    min1 = curMin1, min2 = curMin2, idx1 = curIdx1
return min1
```
Time: O(n^2), Space: O(1).

---

**Count Square Submatrices with All Ones (LC 1277)**
*Idea:* dp[i][j] = side length of the largest all-1 square ending at (i,j). Every side length from 1..dp[i][j] is a valid square.
```
ans = 0
for i = 0 to m-1:
    for j = 0 to n-1:
        if matrix[i][j] == 1:
            if i == 0 or j == 0: dp[i][j] = 1
            else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
            ans += dp[i][j]
return ans
```
Time: O(mn), Space: O(n) with rolling row.

---

**Out of Boundary Paths (LC 576)**
*Idea:* dp[r][c] = paths currently at cell (r,c). Each move distributes paths to neighbors; moves leaving the grid add to answer.
```
dp[startRow][startColumn] = 1
ans = 0
for move = 1 to maxMove:
    next = all zeros
    for each cell (r,c):
        for each direction:
            if next cell is outside: ans += dp[r][c]
            else: next[nr][nc] += dp[r][c]
    dp = next % MOD
return ans % MOD
```
Time: O(maxMove * mn), Space: O(mn).

---

**Paths in Matrix Whose Sum Is Divisible by K (LC 2435)**
*Idea:* dp[i][j][r] = number of paths to (i,j) whose sum has remainder r modulo k.
```
dp[0][0][grid[0][0] % k] = 1
for i = 0 to m-1:
    for j = 0 to n-1:
        for r = 0 to k-1:
            nr = (r + grid[i][j]) % k
            if i > 0: dp[i][j][nr] += dp[i-1][j][r]
            if j > 0: dp[i][j][nr] += dp[i][j-1][r]
return dp[m-1][n-1][0] % MOD
```
Time: O(mnk), Space: O(nk) with rolling row.

---

## 3. Subsequence DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Longest Increasing Subsequence | 300 | Medium |
| 2 | Number of Longest Increasing Subsequence | 673 | Medium |
| 3 | Longest Common Subsequence | 1143 | Medium |
| 4 | Shortest Common Supersequence | 1092 | Hard |
| 5 | Maximum Length of Repeated Subarray | 718 | Medium |
| 6 | Distinct Subsequences | 115 | Hard |
| 7 | Edit Distance | 72 | Medium |
| 8 | Minimum ASCII Delete Sum for Two Strings | 712 | Medium |
| 9 | Delete Operation for Two Strings | 583 | Medium |
| 10 | Longest Palindromic Subsequence | 516 | Medium |
| 11 | Longest Palindromic Substring | 5 | Medium |
| 12 | Palindrome Partitioning II | 132 | Hard |
| 13 | Minimum Insertion Steps to Make a String Palindrome | 1312 | Hard |
| 14 | Longest Arithmetic Subsequence | 1027 | Medium |
| 15 | Longest Arithmetic Subsequence of Given Difference | 1218 | Medium |
| 16 | Longest String Chain | 1048 | Medium |
| 17 | Interleaving String | 97 | Medium |
| 18 | Wildcard Matching | 44 | Hard |
| 19 | Regular Expression Matching | 10 | Hard |
| 20 | Is Subsequence | 392 | Easy |
| 21 | Count Different Palindromic Subsequences | 730 | Hard |
| 22 | Make Array Strictly Increasing | 1187 | Hard |
| 23 | Longest Ideal Subsequence | 2370 | Medium |
| 24 | Number of Longest Increasing Subsequence | 673 | Medium |

### Key Solutions

**Longest Increasing Subsequence (LC 300)**
*Idea (O(n^2)):* dp[i] = length of LIS ending at index i.
```
for i = 0 to n-1:
    dp[i] = 1
    for j = 0 to i-1:
        if nums[j] < nums[i]:
            dp[i] = max(dp[i], dp[j] + 1)
return max(dp)
```
*O(n log n) — patience sorting:*
```
tails = []
for x in nums:
    pos = bisect_left(tails, x)
    if pos == len(tails): tails.append(x)
    else: tails[pos] = x
return len(tails)
```

---

**Longest Common Subsequence (LC 1143)**
*Idea:* Classic 2D DP on two strings.
```
dp[i][j] = LCS of s1[0..i-1] and s2[0..j-1]
for i = 1 to m:
    for j = 1 to n:
        if s1[i-1] == s2[j-1]:
            dp[i][j] = dp[i-1][j-1] + 1
        else:
            dp[i][j] = max(dp[i-1][j], dp[i][j-1])
return dp[m][n]
```

---

**Edit Distance (LC 72)**
*Idea:* dp[i][j] = min ops to convert s1[0..i-1] to s2[0..j-1].
```
dp[i][0] = i, dp[0][j] = j
for i = 1 to m:
    for j = 1 to n:
        if s1[i-1] == s2[j-1]:
            dp[i][j] = dp[i-1][j-1]
        else:
            dp[i][j] = 1 + min(dp[i-1][j],     // delete
                               dp[i][j-1],       // insert
                               dp[i-1][j-1])     // replace
return dp[m][n]
```

---

**Longest Palindromic Subsequence (LC 516)**
*Idea:* dp[i][j] = LPS in s[i..j]. Expand from length 1 outward.
```
dp[i][i] = 1
for len = 2 to n:
    for i = 0 to n-len:
        j = i + len - 1
        if s[i] == s[j]:
            dp[i][j] = dp[i+1][j-1] + 2
        else:
            dp[i][j] = max(dp[i+1][j], dp[i][j-1])
return dp[0][n-1]
```
Alternatively: LPS(s) = LCS(s, reverse(s)).

---

**Longest Palindromic Substring (LC 5)**
*Idea:* Expand around center for each index (and between indices).
```
for center in 0 to 2n-1:
    l = center / 2
    r = l + center % 2
    while l >= 0 and r < n and s[l] == s[r]:
        update maxLen if r - l + 1 > maxLen
        l--, r++
return longest
```
Time: O(n^2). Manacher's gives O(n).

---

**Interleaving String (LC 97)**
*Idea:* dp[i][j] = can s3[0..i+j-1] be formed by interleaving s1[0..i-1] and s2[0..j-1].
```
dp[0][0] = true
for i = 0 to m:
    for j = 0 to n:
        if i > 0 and dp[i-1][j] and s1[i-1] == s3[i+j-1]: dp[i][j] = true
        if j > 0 and dp[i][j-1] and s2[j-1] == s3[i+j-1]: dp[i][j] = true
return dp[m][n]
```

---

**Distinct Subsequences (LC 115)**
*Idea:* dp[i][j] = number of ways s[0..i-1] contains t[0..j-1] as a subsequence.
```
dp[i][0] = 1  // empty t always matches
for i = 1 to m:
    for j = 1 to n:
        dp[i][j] = dp[i-1][j]  // skip s[i-1]
        if s[i-1] == t[j-1]:
            dp[i][j] += dp[i-1][j-1]  // use s[i-1]
return dp[m][n]
```

---

**Number of Longest Increasing Subsequence (LC 673)**
*Idea:* Track both LIS length and count of LIS ending at each index.
```
for i = 0 to n-1:
    len[i] = 1
    cnt[i] = 1
    for j = 0 to i-1:
        if nums[j] < nums[i]:
            if len[j] + 1 > len[i]:
                len[i] = len[j] + 1
                cnt[i] = cnt[j]
            else if len[j] + 1 == len[i]:
                cnt[i] += cnt[j]
maxLen = max(len)
return sum(cnt[i] for i where len[i] == maxLen)
```
Time: O(n^2), Space: O(n).

---

**Shortest Common Supersequence (LC 1092)**
*Idea:* Build the LCS table, then walk backward. Matching chars are used once; non-matching chars are both preserved.
```
compute LCS dp[m+1][n+1]
i = m, j = n, ans = []
while i > 0 and j > 0:
    if s1[i-1] == s2[j-1]:
        ans.push(s1[i-1]); i--; j--
    else if dp[i-1][j] >= dp[i][j-1]:
        ans.push(s1[i-1]); i--
    else:
        ans.push(s2[j-1]); j--
append remaining chars from s1 and s2
reverse(ans)
return join(ans)
```
Time: O(mn), Space: O(mn).

---

**Maximum Length of Repeated Subarray (LC 718)**
*Idea:* dp[i][j] = length of common suffix ending at nums1[i-1] and nums2[j-1].
```
ans = 0
for i = 1 to m:
    for j = n downto 1:
        if nums1[i-1] == nums2[j-1]:
            dp[j] = dp[j-1] + 1
            ans = max(ans, dp[j])
        else:
            dp[j] = 0
return ans
```
Time: O(mn), Space: O(n).

---

**Minimum ASCII Delete Sum for Two Strings (LC 712)**
*Idea:* dp[i][j] = minimum ASCII deletion sum to make s1[0..i-1] and s2[0..j-1] equal.
```
dp[i][0] = dp[i-1][0] + ascii(s1[i-1])
dp[0][j] = dp[0][j-1] + ascii(s2[j-1])
for i = 1 to m:
    for j = 1 to n:
        if s1[i-1] == s2[j-1]:
            dp[i][j] = dp[i-1][j-1]
        else:
            dp[i][j] = min(dp[i-1][j] + ascii(s1[i-1]),
                           dp[i][j-1] + ascii(s2[j-1]))
return dp[m][n]
```
Time: O(mn), Space: O(n) with rolling row.

---

**Delete Operation for Two Strings (LC 583)**
*Idea:* Same as ASCII Delete Sum, but every deletion costs 1. Equivalent to m + n - 2 * LCS.
```
dp[i][0] = i
dp[0][j] = j
for i = 1 to m:
    for j = 1 to n:
        if word1[i-1] == word2[j-1]:
            dp[i][j] = dp[i-1][j-1]
        else:
            dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1])
return dp[m][n]
```
Time: O(mn), Space: O(n) with rolling row.

---

**Minimum Insertion Steps to Make a String Palindrome (LC 1312)**
*Idea:* dp[i][j] = min insertions needed to make s[i..j] a palindrome.
```
for len = 2 to n:
    for i = 0 to n-len:
        j = i + len - 1
        if s[i] == s[j]:
            dp[i][j] = dp[i+1][j-1]
        else:
            dp[i][j] = 1 + min(dp[i+1][j], dp[i][j-1])
return dp[0][n-1]
```
Time: O(n^2), Space: O(n^2). Also n - LPS(s).

---

**Longest Arithmetic Subsequence (LC 1027)**
*Idea:* dp[i][diff] = longest arithmetic subsequence ending at index i with difference diff.
```
ans = 2
for i = 0 to n-1:
    for j = 0 to i-1:
        diff = nums[i] - nums[j]
        dp[i][diff] = max(dp[i][diff], dp[j].get(diff, 1) + 1)
        ans = max(ans, dp[i][diff])
return ans
```
Time: O(n^2), Space: O(n^2).

---

**Longest Arithmetic Subsequence of Given Difference (LC 1218)**
*Idea:* dp[x] = best subsequence length ending with value x.
```
ans = 0
for x in arr:
    dp[x] = dp.get(x - difference, 0) + 1
    ans = max(ans, dp[x])
return ans
```
Time: O(n), Space: O(n).

---

**Longest String Chain (LC 1048)**
*Idea:* Sort words by length. Each word can extend any predecessor made by deleting one character.
```
sort words by length
for word in words:
    dp[word] = 1
    for k = 0 to len(word)-1:
        pred = word without char k
        dp[word] = max(dp[word], dp.get(pred, 0) + 1)
return max(dp.values())
```
Time: O(n * L^2), Space: O(n).

---

**Is Subsequence (LC 392)**
*Idea:* Two pointers. Advance the pointer in s only when a matching char is found in t.
```
i = 0
for ch in t:
    if i < len(s) and s[i] == ch:
        i++
return i == len(s)
```
Time: O(len(t)), Space: O(1).

---

**Count Different Palindromic Subsequences (LC 730)**
*Idea:* Interval DP with inclusion-exclusion. When endpoints match, adjust based on how many same endpoint chars exist inside.
```
for i = 0 to n-1: dp[i][i] = 1
for len = 2 to n:
    for i = 0 to n-len:
        j = i + len - 1
        if s[i] != s[j]:
            dp[i][j] = dp[i+1][j] + dp[i][j-1] - dp[i+1][j-1]
        else:
            l = first index > i with s[l] == s[i]
            r = last index < j with s[r] == s[j]
            if l > r: dp[i][j] = 2 * dp[i+1][j-1] + 2
            else if l == r: dp[i][j] = 2 * dp[i+1][j-1] + 1
            else: dp[i][j] = 2 * dp[i+1][j-1] - dp[l+1][r-1]
        dp[i][j] = (dp[i][j] + MOD) % MOD
return dp[0][n-1]
```
Time: O(n^2) with precomputed next/prev same-char indexes, Space: O(n^2).

---

**Make Array Strictly Increasing (LC 1187)**
*Idea:* Sort and dedupe arr2. Keep states of last chosen value -> min replacements after processing each arr1 element.
```
arr2 = sort(unique(arr2))
states = { -INF: 0 }
for x in arr1:
    nextStates = {}
    for last, ops in states:
        if x > last:
            nextStates[x] = min(nextStates.get(x, INF), ops)
        y = first value in arr2 with y > last
        if y exists:
            nextStates[y] = min(nextStates.get(y, INF), ops + 1)
    states = nextStates
return min(states.values()) if states not empty else -1
```
Time: O(n * states * log m), Space: O(states).

---

**Longest Ideal Subsequence (LC 2370)**
*Idea:* dp[c] = best ideal subsequence ending with character c.
```
for ch in s:
    idx = ch - 'a'
    best = 1
    for c = max(0, idx-k) to min(25, idx+k):
        best = max(best, dp[c] + 1)
    dp[idx] = max(dp[idx], best)
return max(dp)
```
Time: O(26n), Space: O(26).

---

## 4. Knapsack Variants

### 4a. 0/1 Knapsack
| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Partition Equal Subset Sum | 416 | Medium |
| 2 | Target Sum | 494 | Medium |
| 3 | Last Stone Weight II | 1049 | Medium |
| 4 | Ones and Zeroes | 474 | Medium |
| 5 | Profitable Schemes | 879 | Hard |

### 4b. Unbounded Knapsack
| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Coin Change | 322 | Medium |
| 2 | Coin Change II (count combinations) | 518 | Medium |
| 3 | Perfect Squares | 279 | Medium |
| 4 | Minimum Cost for Tickets | 983 | Medium |

### 4c. Bounded / Multi-dimensional Knapsack
| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Ones and Zeroes | 474 | Medium |
| 2 | Profitable Schemes | 879 | Hard |
| 3 | Tallest Billboard | 956 | Hard |
| 4 | Number of Ways to Earn Points | 2585 | Hard |

### Key Solutions

**Partition Equal Subset Sum (LC 416)**
*Idea:* 0/1 knapsack — can we pick a subset summing to totalSum/2?
```
target = sum(nums) / 2
if sum is odd: return false
dp[0] = true  // dp[j] = can we form sum j
for num in nums:
    for j = target downto num:   // iterate backwards for 0/1
        dp[j] = dp[j] or dp[j - num]
return dp[target]
```

---

**Target Sum (LC 494)**
*Idea:* Transform to subset sum. Let P = subset with +, N = subset with -. P - N = target, P + N = total. So P = (total + target) / 2. Count subsets summing to P.
```
newTarget = (sum + target) / 2
dp[0] = 1
for num in nums:
    for j = newTarget downto num:
        dp[j] += dp[j - num]
return dp[newTarget]
```

---

**Coin Change (LC 322)**
*Idea:* Unbounded knapsack — min coins to make amount.
```
dp[0] = 0, dp[1..amount] = INF
for coin in coins:
    for j = coin to amount:    // forward for unbounded
        dp[j] = min(dp[j], dp[j - coin] + 1)
return dp[amount] if dp[amount] != INF else -1
```

---

**Coin Change II (LC 518)**
*Idea:* Count combinations (not permutations) — outer loop over coins.
```
dp[0] = 1
for coin in coins:          // coin loop outer = combinations
    for j = coin to amount:
        dp[j] += dp[j - coin]
return dp[amount]
```

---

**Ones and Zeroes (LC 474)**
*Idea:* 2D 0/1 knapsack with capacities m (zeros) and n (ones).
```
dp[i][j] = max subset size using at most i zeros and j ones
for str in strs:
    zeros = count('0', str), ones = count('1', str)
    for i = m downto zeros:
        for j = n downto ones:
            dp[i][j] = max(dp[i][j], dp[i-zeros][j-ones] + 1)
return dp[m][n]
```

---

**Last Stone Weight II (LC 1049)**
*Idea:* Split stones into two groups with sums as close as possible. The final stone is the absolute difference.
```
target = sum(stones) / 2
dp[0] = true
for stone in stones:
    for j = target downto stone:
        dp[j] = dp[j] or dp[j - stone]
best = largest j <= target where dp[j] is true
return sum(stones) - 2 * best
```
Time: O(n * sum), Space: O(sum).

---

**Profitable Schemes (LC 879)**
*Idea:* 0/1 knapsack counting ways. State tracks people used and profit, with profit capped at minProfit.
```
dp[0][0] = 1
for each crime with group g and profit p:
    next = copy(dp)
    for people = 0 to n:
        for prof = 0 to minProfit:
            if people + g <= n:
                np = min(minProfit, prof + p)
                next[people + g][np] += dp[people][prof]
    dp = next % MOD
return sum(dp[people][minProfit] for people = 0..n) % MOD
```
Time: O(crimes * n * minProfit), Space: O(n * minProfit).

---

**Tallest Billboard (LC 956)**
*Idea:* dp[diff] = maximum shorter-side height possible for two supports with height difference diff.
```
dp[0] = 0
for rod in rods:
    next = copy(dp)
    for diff, shorter in dp:
        next[diff + rod] = max(next[diff + rod], shorter)
        ndiff = abs(diff - rod)
        next[ndiff] = max(next[ndiff], shorter + min(diff, rod))
    dp = next
return dp[0]
```
Time: O(n * states), Space: O(states).

---

**Number of Ways to Earn Points (LC 2585)**
*Idea:* Bounded knapsack counting ways. For each question type, choose 0..count questions.
```
dp[0] = 1
for count, marks in types:
    next[0..target] = 0
    for score = 0 to target:
        for take = 0 to count:
            ns = score + take * marks
            if ns > target: break
            next[ns] = (next[ns] + dp[score]) % MOD
    dp = next
return dp[target]
```
Time: O(types * target * maxCount), Space: O(target).

---

## 5. Interval DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Burst Balloons | 312 | Hard |
| 2 | Minimum Cost to Merge Stones | 1000 | Hard |
| 3 | Strange Printer | 664 | Hard |
| 4 | Minimum Score Triangulation of Polygon | 1039 | Medium |
| 5 | Palindrome Partitioning II | 132 | Hard |
| 6 | Minimum Cost to Cut a Stick | 1547 | Hard |
| 7 | Boolean Parenthesization (GFG) | — | Hard |
| 8 | Matrix Chain Multiplication (classic) | — | Medium |
| 9 | Longest Palindromic Subsequence | 516 | Medium |
| 10 | Predict the Winner | 486 | Medium |
| 11 | Stone Game | 877 | Medium |
| 12 | Stone Game III | 1406 | Hard |
| 13 | Minimum Cost Tree From Leaf Values | 1130 | Medium |
| 14 | Remove Boxes | 546 | Hard |
| 15 | Zuma Game | 488 | Hard |

### Key Solutions

**Burst Balloons (LC 312)**
*Idea:* dp[i][j] = max coins from bursting balloons in range (i, j) exclusive. Pick k as the LAST balloon to burst in the range.
```
// pad nums with 1 at both ends
for len = 2 to n+1:
    for i = 0 to n+1-len:
        j = i + len
        for k = i+1 to j-1:
            dp[i][j] = max(dp[i][j],
                dp[i][k] + dp[k][j] + nums[i]*nums[k]*nums[j])
return dp[0][n+1]
```

---

**Matrix Chain Multiplication**
*Idea:* dp[i][j] = min multiplications for matrices i..j. Try every split point k.
```
for len = 2 to n:
    for i = 1 to n-len+1:
        j = i + len - 1
        dp[i][j] = INF
        for k = i to j-1:
            cost = dp[i][k] + dp[k+1][j] + p[i-1]*p[k]*p[j]
            dp[i][j] = min(dp[i][j], cost)
return dp[1][n]
```

---

**Minimum Cost to Cut a Stick (LC 1547)**
*Idea:* Sort cuts, add 0 and n as boundaries. dp[i][j] = min cost to process segment between cut[i] and cut[j].
```
cuts = sort([0] + cuts + [n])
for len = 2 to m:
    for i = 0 to m-len:
        j = i + len
        dp[i][j] = INF
        for k = i+1 to j-1:
            dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j] + cuts[j] - cuts[i])
return dp[0][m]
```

---

**Palindrome Partitioning II (LC 132)**
*Idea:* dp[i] = min cuts for s[0..i]. Precompute palindrome table.
```
// isPalin[i][j] via expansion or DP
dp[i] = i  // worst case: cut every char
for i = 1 to n-1:
    if isPalin[0][i]: dp[i] = 0; continue
    for j = 1 to i:
        if isPalin[j][i]:
            dp[i] = min(dp[i], dp[j-1] + 1)
return dp[n-1]
```

---

## 6. Tree DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | House Robber III | 337 | Medium |
| 2 | Binary Tree Maximum Path Sum | 124 | Hard |
| 3 | Diameter of Binary Tree | 543 | Easy |
| 4 | Longest ZigZag Path in a Binary Tree | 1372 | Medium |
| 5 | Unique Binary Search Trees | 96 | Medium |
| 6 | Unique Binary Search Trees II | 95 | Medium |
| 7 | Binary Tree Cameras | 968 | Hard |
| 8 | Sum of Distances in Tree | 834 | Hard |
| 9 | Minimum Cost Tree From Leaf Values | 1130 | Medium |
| 10 | Linked List in Binary Tree | 1367 | Medium |
| 11 | Count Number of Maximum Bitwise-OR Subsets | 2044 | Medium |
| 12 | Distribute Coins in Binary Tree | 979 | Medium |
| 13 | Maximum Product of Splitted Binary Tree | 1339 | Medium |
| 14 | Number of Good Leaf Nodes Pairs | 1530 | Medium |
| 15 | Longest Path With Different Adjacent Characters | 2246 | Hard |

### Key Solutions

**House Robber III (LC 337)**
*Idea:* Each node returns (rob_it, skip_it).
```
function dfs(node):
    if node is null: return (0, 0)
    left = dfs(node.left)
    right = dfs(node.right)
    rob = node.val + left.skip + right.skip
    skip = max(left.rob, left.skip) + max(right.rob, right.skip)
    return (rob, skip)

return max(dfs(root))
```

---

**Binary Tree Maximum Path Sum (LC 124)**
*Idea:* At each node, max path through it = node.val + max(0, left) + max(0, right). Return single-branch max upward.
```
maxSum = -INF
function dfs(node):
    if node is null: return 0
    left = max(0, dfs(node.left))
    right = max(0, dfs(node.right))
    maxSum = max(maxSum, node.val + left + right)
    return node.val + max(left, right)
```

---

**Unique Binary Search Trees (LC 96) — Catalan Number**
*Idea:* dp[n] = number of structurally unique BSTs with n nodes.
```
dp[0] = 1, dp[1] = 1
for i = 2 to n:
    for j = 0 to i-1:
        dp[i] += dp[j] * dp[i-1-j]  // left subtree * right subtree
return dp[n]
// Catalan: C(n) = C(2n,n)/(n+1)
```

---

**Binary Tree Cameras (LC 968)**
*Idea:* Greedy post-order DFS. Each node is in one state: {NOT_COVERED, HAS_CAMERA, COVERED}.
```
cameras = 0
function dfs(node):
    if node is null: return COVERED
    left = dfs(node.left)
    right = dfs(node.right)
    if left == NOT_COVERED or right == NOT_COVERED:
        cameras++; return HAS_CAMERA
    if left == HAS_CAMERA or right == HAS_CAMERA:
        return COVERED
    return NOT_COVERED

if dfs(root) == NOT_COVERED: cameras++
return cameras
```

---

**Sum of Distances in Tree (LC 834) — Rerooting**
*Idea:* Two DFS passes. First: compute subtree sizes and sum of distances rooted at 0. Second: reroot to each child.
```
// DFS1: compute count[node], distSum[0]
// DFS2: for child c of parent p:
//   ans[c] = ans[p] - count[c] + (n - count[c])
//   (moving root to c: count[c] nodes get 1 closer, n-count[c] get 1 farther)
```

---

## 7. State Machine / Stock Problems

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Best Time to Buy and Sell Stock | 121 | Easy |
| 2 | Best Time to Buy and Sell Stock II | 122 | Medium |
| 3 | Best Time to Buy and Sell Stock III | 123 | Hard |
| 4 | Best Time to Buy and Sell Stock IV | 188 | Hard |
| 5 | Best Time to Buy and Sell Stock with Cooldown | 309 | Medium |
| 6 | Best Time to Buy and Sell Stock with Transaction Fee | 714 | Medium |
| 7 | Paint House | 256 | Medium |
| 8 | Paint House II (k colors) | 265 | Hard |
| 9 | Paint Fence | 276 | Medium |

### Key Solutions

**Stock I (LC 121)**
*Idea:* Track min price so far, maximize profit.
```
minPrice = INF, maxProfit = 0
for price in prices:
    minPrice = min(minPrice, price)
    maxProfit = max(maxProfit, price - minPrice)
return maxProfit
```

---

**Stock IV — General K transactions (LC 188)**
*Idea:* dp[k][0] = max profit after k-th transaction, not holding. dp[k][1] = holding.
```
dp[0..k][0] = 0
dp[0..k][1] = -INF
for price in prices:
    for j = 1 to k:
        dp[j][0] = max(dp[j][0], dp[j][1] + price)   // sell
        dp[j][1] = max(dp[j][1], dp[j-1][0] - price)  // buy
return dp[k][0]
```

---

**Stock with Cooldown (LC 309)**
*Idea:* Three states: hold, sold (cooldown next day), rest.
```
hold = -prices[0], sold = 0, rest = 0
for i = 1 to n-1:
    prevSold = sold
    sold = hold + prices[i]
    hold = max(hold, rest - prices[i])
    rest = max(rest, prevSold)
return max(sold, rest)
```

---

## 8. Bitmask DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Travelling Salesman Problem (classic) | — | Hard |
| 2 | Shortest Path Visiting All Nodes | 847 | Hard |
| 3 | Partition to K Equal Sum Subsets | 698 | Medium |
| 4 | Can I Win | 464 | Medium |
| 5 | Stickers to Spell Word | 691 | Hard |
| 6 | Minimum Number of Work Sessions to Finish Tasks | 1986 | Medium |
| 7 | Maximum Students Taking Exam | 1349 | Hard |
| 8 | Distribute Repeating Integers | 1655 | Hard |
| 9 | Number of Ways to Wear Different Hats | 1434 | Hard |
| 10 | Find the Shortest Superstring | 943 | Hard |
| 11 | Parallel Courses II | 1494 | Hard |
| 12 | Maximum AND Sum of Array | 2172 | Hard |
| 13 | Minimum XOR Sum of Two Arrays | 1879 | Hard |
| 14 | Count Number of Maximum Bitwise-OR Subsets | 2044 | Medium |
| 15 | Smallest Sufficient Team | 1125 | Hard |
| 16 | Maximum Number of Achievable Transfer Requests | 1601 | Hard |
| 17 | Fair Distribution of Cookies | 2305 | Medium |
| 18 | Maximize Score After N Operations | 1799 | Hard |
| 19 | Matchsticks to Square | 473 | Medium |

### Key Solutions

**Travelling Salesman Problem (TSP)**
*Idea:* dp[mask][i] = min cost to visit cities in mask, ending at city i.
```
dp[1 << start][start] = 0
for mask = 0 to (1 << n) - 1:
    for u in bits of mask:
        for v not in mask:
            newMask = mask | (1 << v)
            dp[newMask][v] = min(dp[newMask][v], dp[mask][u] + dist[u][v])
return min over all i of dp[(1<<n)-1][i] + dist[i][start]
```
Time: O(2^n * n^2).

---

**Partition to K Equal Sum Subsets (LC 698)**
*Idea:* Bitmask over which elements are used. Track current bucket sum.
```
target = sum / k
dp[mask] = current partial sum of active bucket (-1 if unreachable)
dp[0] = 0
for mask = 0 to (1<<n)-1:
    if dp[mask] == -1: continue
    for i not in mask:
        if dp[mask] + nums[i] <= target:
            dp[mask | (1<<i)] = (dp[mask] + nums[i]) % target
return dp[(1<<n)-1] == 0
```

---

**Smallest Sufficient Team (LC 1125)**
*Idea:* Bitmask over required skills. For each person, their skill mask is precomputed.
```
dp[0] = empty team
for mask = 0 to (1 << m) - 1:
    if dp[mask] not set: continue
    for each person p:
        newMask = mask | skills[p]
        if dp[newMask] not set or |dp[mask]| + 1 < |dp[newMask]|:
            dp[newMask] = dp[mask] + {p}
return dp[(1<<m)-1]
```

---

## 9. Digit DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Count of Integers (with digit sum constraints) | 2719 | Hard |
| 2 | Numbers At Most N Given Digit Set | 902 | Hard |
| 3 | Non-negative Integers without Consecutive Ones | 600 | Hard |
| 4 | Numbers With Repeated Digits | 1012 | Hard |
| 5 | Count Special Integers | 2376 | Hard |
| 6 | Number of Digit One | 233 | Hard |
| 7 | Rotated Digits | 788 | Medium |
| 8 | Count Numbers with Unique Digits | 357 | Medium |
| 9 | Digit Count in Range | 1067 | Hard |

### Key Solutions

**Digit DP Template**
*Idea:* Process digits left to right. Track `tight` (still bounded by N), `started` (leading zeros), and problem-specific state.
```
function solve(N):
    digits = str(N)
    memo = {}

    function dp(pos, tight, started, ...state):
        if pos == len(digits): return base_case
        if (pos, tight, started, state) in memo: return memo[...]

        limit = digits[pos] if tight else 9
        result = 0
        for d = 0 to limit:
            newTight = tight and (d == limit)
            newStarted = started or (d > 0)
            result += dp(pos+1, newTight, newStarted, newState(d))

        memo[...] = result
        return result

    return dp(0, true, false, initialState)
```
Use f(R) - f(L-1) for range queries.

---

**Numbers With Repeated Digits (LC 1012)**
*Idea:* Count numbers with ALL unique digits up to N, then subtract from N.
```
answer = N - countUnique(N)
// countUnique uses digit DP with bitmask of used digits
```

---

## 10. DP on Strings (Pattern Matching / Parsing)

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Regular Expression Matching | 10 | Hard |
| 2 | Wildcard Matching | 44 | Hard |
| 3 | Distinct Subsequences | 115 | Hard |
| 4 | Scramble String | 87 | Hard |
| 5 | Palindrome Partitioning II | 132 | Hard |
| 6 | Encode String with Shortest Length | 471 | Hard |
| 7 | Concatenated Words | 472 | Hard |
| 8 | Count the Repetitions | 466 | Hard |
| 9 | Longest Happy String | 1405 | Medium |
| 10 | Longest Valid Parentheses | 32 | Hard |
| 11 | Remove Invalid Parentheses | 301 | Hard |
| 12 | Minimum Window Subsequence | 727 | Hard |

### Key Solutions

**Regular Expression Matching (LC 10)**
*Idea:* dp[i][j] = does s[0..i-1] match p[0..j-1].
```
dp[0][0] = true
// handle patterns like a*, a*b*, etc.
for j = 1 to m:
    if p[j-1] == '*': dp[0][j] = dp[0][j-2]

for i = 1 to n:
    for j = 1 to m:
        if p[j-1] == '.' or p[j-1] == s[i-1]:
            dp[i][j] = dp[i-1][j-1]
        elif p[j-1] == '*':
            dp[i][j] = dp[i][j-2]  // zero occurrences
            if p[j-2] == '.' or p[j-2] == s[i-1]:
                dp[i][j] |= dp[i-1][j]  // one+ occurrences
return dp[n][m]
```

---

**Wildcard Matching (LC 44)**
*Idea:* Similar to regex but simpler. `?` matches one char, `*` matches any sequence.
```
dp[0][0] = true
for j = 1 to m:
    if p[j-1] == '*': dp[0][j] = dp[0][j-1]

for i = 1 to n:
    for j = 1 to m:
        if p[j-1] == s[i-1] or p[j-1] == '?':
            dp[i][j] = dp[i-1][j-1]
        elif p[j-1] == '*':
            dp[i][j] = dp[i-1][j] or dp[i][j-1]
return dp[n][m]
```

---

**Longest Valid Parentheses (LC 32)**
*Idea:* dp[i] = length of longest valid parentheses ending at index i.
```
for i = 1 to n-1:
    if s[i] == ')':
        if s[i-1] == '(':
            dp[i] = (dp[i-2] if i >= 2 else 0) + 2
        elif dp[i-1] > 0:
            j = i - dp[i-1] - 1
            if j >= 0 and s[j] == '(':
                dp[i] = dp[i-1] + 2 + (dp[j-1] if j >= 1 else 0)
return max(dp)
```

---

## 11. DP with Data Structures (Monotonic Stack/Queue, Segment Tree, BIT)

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Largest Rectangle in Histogram | 84 | Hard |
| 2 | Maximal Rectangle | 85 | Hard |
| 3 | Constrained Subsequence Sum | 1425 | Hard |
| 4 | Jump Game VI | 1696 | Medium |
| 5 | Max Value of Equation | 1499 | Hard |
| 6 | Longest Increasing Subsequence (BIT / segment tree opt) | 300 | Medium |
| 7 | Create Maximum Number | 321 | Hard |
| 8 | Sliding Window Maximum (used as subproblem) | 239 | Hard |
| 9 | Maximum Sum Circular Subarray | 918 | Medium |
| 10 | Sum of Subarray Minimums | 907 | Medium |
| 11 | Sum of Subarray Ranges | 2104 | Medium |

### Key Solutions

**Constrained Subsequence Sum (LC 1425)**
*Idea:* dp[i] = max sum of subsequence ending at i with consecutive elements at most k apart. Use monotonic deque for O(n).
```
deque = []  // stores indices of dp values in decreasing order
for i = 0 to n-1:
    dp[i] = nums[i]
    if deque not empty:
        dp[i] = max(dp[i], dp[deque.front()] + nums[i])
    // remove from back if dp[i] >= dp[deque.back()]
    while deque not empty and dp[deque.back()] <= dp[i]:
        deque.pop_back()
    deque.push_back(i)
    // remove expired front
    if deque.front() <= i - k: deque.pop_front()
return max(dp)
```

---

**Sum of Subarray Minimums (LC 907)**
*Idea:* For each element, find how many subarrays it is the minimum of using monotonic stack (PLE/NLE).
```
// PLE[i] = distance to Previous Less Element
// NLE[i] = distance to Next Less-or-Equal Element
stack = []
for i = 0 to n-1:
    while stack not empty and nums[stack.top()] >= nums[i]:
        stack.pop()
    PLE[i] = i - stack.top() (or i+1 if empty)
    stack.push(i)
// similarly compute NLE
answer = sum(nums[i] * PLE[i] * NLE[i]) for all i
```

---

**Jump Game VI (LC 1696)**
*Idea:* dp[i] = max score reaching index i. Use monotonic deque of size k.
```
dp[0] = nums[0]
deque = [0]
for i = 1 to n-1:
    while deque.front() < i - k: deque.pop_front()
    dp[i] = nums[i] + dp[deque.front()]
    while deque not empty and dp[deque.back()] <= dp[i]:
        deque.pop_back()
    deque.push_back(i)
return dp[n-1]
```

---

## 12. Game Theory DP (Minimax)

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Predict the Winner | 486 | Medium |
| 2 | Stone Game | 877 | Medium |
| 3 | Stone Game II | 1140 | Medium |
| 4 | Stone Game III | 1406 | Hard |
| 5 | Stone Game IV | 1510 | Hard |
| 6 | Stone Game V | 1563 | Hard |
| 7 | Can I Win | 464 | Medium |
| 8 | Flip Game II | 294 | Medium |
| 9 | Nim Game variants | 292 | Easy |
| 10 | Cat and Mouse | 913 | Hard |
| 11 | Cat and Mouse II | 1728 | Hard |
| 12 | Optimal Account Balancing | 465 | Hard |

### Key Solutions

**Predict the Winner (LC 486)**
*Idea:* dp[i][j] = max score advantage the current player has over opponent in nums[i..j].
```
dp[i][i] = nums[i]
for len = 2 to n:
    for i = 0 to n-len:
        j = i + len - 1
        dp[i][j] = max(nums[i] - dp[i+1][j],
                       nums[j] - dp[i][j-1])
return dp[0][n-1] >= 0
```

---

**Stone Game II (LC 1140)**
*Idea:* dp[i][M] = max stones current player can get from piles[i..] with parameter M.
```
function dp(i, M, isAlice):
    if i >= n: return 0
    if memo[i][M]: return it
    best = 0
    total = 0
    for x = 1 to 2*M:
        if i + x > n: break
        total += piles[i + x - 1]
        // current player wants to maximize their own take
        best = max(best, total + suffixSum[i+x] - dp(i+x, max(M, x)))
    return best

// simplified: dp(i,M) = max stones for current player
// dp(i,M) = max over x in [1,2M] of suffix[i] - dp(i+x, max(M,x))
```

---

**Can I Win (LC 464)**
*Idea:* Bitmask DP + minimax. Mask tracks which numbers are used.
```
function canWin(mask, remaining):
    if memo[mask] exists: return it
    for i = 1 to maxChoosable:
        if i not in mask:
            if i >= remaining:
                return memo[mask] = true  // current player wins
            if not canWin(mask | (1<<i), remaining - i):
                return memo[mask] = true  // opponent loses
    return memo[mask] = false
```

---

## 13. Counting DP / Combinatorics

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Unique Binary Search Trees (Catalan) | 96 | Medium |
| 2 | Unique Paths | 62 | Medium |
| 3 | Combination Sum IV | 377 | Medium |
| 4 | Knight Dialer | 935 | Medium |
| 5 | Domino and Tromino Tiling | 790 | Medium |
| 6 | Number of Music Playlists | 920 | Hard |
| 7 | Number of Ways to Rearrange Sticks (Stirling) | 1866 | Hard |
| 8 | Count All Valid Pickup and Delivery Options | 1359 | Hard |
| 9 | Count Vowels Permutation | 1220 | Hard |
| 10 | Number of Ways to Paint N x 3 Grid | 1411 | Hard |
| 11 | Count Fertile Pyramids in Land | 2088 | Hard |
| 12 | Number of Dice Rolls With Target Sum | 1155 | Medium |
| 13 | Number of Ways to Form a Target String Given a Dictionary | 1639 | Hard |
| 14 | Build Array Where You Can Find Maximum Exactly K Comparisons | 1420 | Hard |
| 15 | Student Attendance Record II | 552 | Hard |

### Key Solutions

**Knight Dialer (LC 935)**
*Idea:* State = current digit. Transitions follow knight moves on phone pad.
```
// Knight move map: 0->[4,6], 1->[6,8], 2->[7,9], 3->[4,8],
// 4->[0,3,9], 5->[], 6->[0,1,7], 7->[2,6], 8->[1,3], 9->[2,4]
dp[digit] = 1 for all digits
for step = 2 to n:
    newDp[digit] = sum(dp[prev] for prev in moves[digit])
    dp = newDp
return sum(dp) % MOD
```

---

**Count Vowels Permutation (LC 1220)**
*Idea:* State machine — each vowel can follow specific vowels.
```
// Rules: a->e, e->a|i, i->all except i, o->i|u, u->a
dp = {a:1, e:1, i:1, o:1, u:1}
for step = 2 to n:
    a' = dp[e] + dp[i] + dp[u]
    e' = dp[a] + dp[i]
    i' = dp[e] + dp[o]
    o' = dp[i]
    u' = dp[i] + dp[o]
    dp = {a', e', i', o', u'}
return sum(dp) % MOD
```

---

**Number of Dice Rolls With Target Sum (LC 1155)**
*Idea:* dp[i][t] = ways to get sum t using i dice.
```
dp[0][0] = 1
for i = 1 to n:        // i-th die
    for t = 1 to target:
        for face = 1 to k:
            if t - face >= 0:
                dp[i][t] += dp[i-1][t-face]
return dp[n][target]
```

---

## 14. Probability / Expected Value DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Knight Probability in Chessboard | 688 | Medium |
| 2 | Soup Servings | 808 | Medium |
| 3 | New 21 Game | 837 | Medium |
| 4 | Tossing Coin (probability DP) | 1230 | Medium |
| 5 | Airplane Seat Assignment Probability | 1227 | Medium |

### Key Solutions

**Knight Probability in Chessboard (LC 688)**
*Idea:* dp[step][r][c] = probability of being at (r,c) after `step` moves.
```
dp[0][startR][startC] = 1.0
for step = 1 to k:
    for r, c on board:
        for each of 8 knight moves (nr, nc):
            if in bounds:
                dp[step][r][c] += dp[step-1][nr][nc] / 8.0
return sum(dp[k][r][c]) for all r, c on board
```

---

**New 21 Game (LC 837)**
*Idea:* dp[i] = probability of reaching score i. Use sliding window sum for efficiency.
```
dp[0] = 1.0
windowSum = 1.0
for i = 1 to n:
    dp[i] = windowSum / maxPts
    if i < k: windowSum += dp[i]
    if i - maxPts >= 0 and i - maxPts < k:
        windowSum -= dp[i - maxPts]
return sum(dp[k..n])
```

---

## 15. DP on DAGs / Graph DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Longest Increasing Path in a Matrix | 329 | Hard |
| 2 | All Paths From Source to Target | 797 | Medium |
| 3 | Number of Ways to Arrive at Destination | 1976 | Medium |
| 4 | Cheapest Flights Within K Stops | 787 | Medium |
| 5 | Course Schedule III | 630 | Hard |
| 6 | Parallel Courses III | 2050 | Hard |
| 7 | Longest Path With Different Adjacent Characters | 2246 | Hard |
| 8 | Number of Restricted Paths From First to Last Node | 1786 | Medium |
| 9 | Frog Jump | 403 | Hard |
| 10 | Minimum Cost to Reach Destination in Time | 1928 | Hard |

### Key Solutions

**Longest Increasing Path in a Matrix (LC 329)**
*Idea:* DFS + memoization. Each cell's value creates a DAG (only move to strictly larger neighbors).
```
function dfs(r, c):
    if memo[r][c]: return it
    best = 1
    for (nr, nc) in 4 neighbors:
        if in bounds and matrix[nr][nc] > matrix[r][c]:
            best = max(best, 1 + dfs(nr, nc))
    return memo[r][c] = best

return max(dfs(r,c)) for all cells
```

---

**Cheapest Flights Within K Stops (LC 787)**
*Idea:* Bellman-Ford with at most k+1 relaxations, or DP with layers.
```
dp[0][src] = 0, all others INF
for i = 1 to k+1:
    dp[i] = copy of dp[i-1]
    for (u, v, w) in flights:
        dp[i][v] = min(dp[i][v], dp[i-1][u] + w)
return dp[k+1][dst]
```

---

**Frog Jump (LC 403)**
*Idea:* dp[stone] = set of possible jump sizes to reach it.
```
dp = {stone: set() for stone in stones}
dp[0] = {0}
for stone in stones:
    for k in dp[stone]:
        for jump in {k-1, k, k+1}:
            if jump > 0 and stone + jump in dp:
                dp[stone + jump].add(jump)
return dp[lastStone] is not empty
```

---

## 16. Partition / Subset DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Partition Equal Subset Sum | 416 | Medium |
| 2 | Partition to K Equal Sum Subsets | 698 | Medium |
| 3 | Split Array Largest Sum | 410 | Hard |
| 4 | Tallest Billboard | 956 | Hard |
| 5 | Fair Distribution of Cookies | 2305 | Medium |
| 6 | Minimum Difference Between Sums After Removal of Elements | 2163 | Hard |
| 7 | Number of Ways to Divide a Long Corridor | 2147 | Hard |
| 8 | Palindrome Partitioning III | 1278 | Hard |
| 9 | Largest Sum of Averages | 813 | Medium |
| 10 | Minimum Difficulty of a Job Schedule | 1335 | Hard |

### Key Solutions

**Split Array Largest Sum (LC 410)**
*Idea (Binary Search):* Binary search on the answer (max subarray sum). Greedily check if we can split into <= k parts.
```
lo = max(nums), hi = sum(nums)
while lo < hi:
    mid = (lo + hi) / 2
    if canSplit(nums, k, mid): hi = mid
    else: lo = mid + 1
return lo

function canSplit(nums, k, maxSum):
    parts = 1, curSum = 0
    for num in nums:
        if curSum + num > maxSum:
            parts++; curSum = 0
        curSum += num
    return parts <= k
```

---

**Minimum Difficulty of a Job Schedule (LC 1335)**
*Idea:* dp[d][i] = min difficulty to schedule jobs[0..i] in d days.
```
dp[1][i] = max(jobs[0..i])
for day = 2 to d:
    for i = day-1 to n-1:
        dp[day][i] = INF
        maxSoFar = 0
        for j = i downto day-1:
            maxSoFar = max(maxSoFar, jobs[j])
            dp[day][i] = min(dp[day][i], dp[day-1][j-1] + maxSoFar)
return dp[d][n-1]
```

---

## 17. DP with Greedy / Binary Search Optimization

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | LIS via patience sorting (nlogn) | 300 | Medium |
| 2 | Russian Doll Envelopes | 354 | Hard |
| 3 | Split Array Largest Sum (binary search) | 410 | Hard |
| 4 | Koko Eating Bananas (binary search framework) | 875 | Medium |
| 5 | Minimum Number of Days to Eat N Oranges | 1553 | Hard |
| 6 | Super Egg Drop | 887 | Hard |
| 7 | Nth Magical Number | 878 | Hard |

### Key Solutions

**Russian Doll Envelopes (LC 354)**
*Idea:* Sort by width ascending, height descending (for same width). Then LIS on heights.
```
sort envelopes by (w asc, h desc)
// LIS on heights using patience sorting O(n log n)
tails = []
for (w, h) in envelopes:
    pos = bisect_left(tails, h)
    if pos == len(tails): tails.append(h)
    else: tails[pos] = h
return len(tails)
```

---

**Super Egg Drop (LC 887)**
*Idea:* dp[m][k] = max floors checkable with m moves and k eggs. Find min m where dp[m][k] >= n.
```
// dp[m][k] = dp[m-1][k-1] + dp[m-1][k] + 1
// (egg breaks: check dp[m-1][k-1] floors below)
// (egg survives: check dp[m-1][k] floors above)
// (+1 for current floor)
for m = 1 to ...:
    for k = 1 to K:
        dp[m][k] = dp[m-1][k-1] + dp[m-1][k] + 1
    if dp[m][K] >= n: return m
```

---

## 18. Multi-dimensional / Complex State DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Super Egg Drop | 887 | Hard |
| 2 | Profitable Schemes | 879 | Hard |
| 3 | Freedom Trail | 514 | Hard |
| 4 | Frog Jump | 403 | Hard |
| 5 | Student Attendance Record II | 552 | Hard |
| 6 | Pizza With 3n Slices | 1388 | Hard |
| 7 | Number of Ways to Stay in the Same Place After Some Steps | 1269 | Hard |
| 8 | K Inverse Pairs Array | 629 | Hard |
| 9 | Odd Even Jump | 975 | Hard |
| 10 | Maximum Profit in Job Scheduling | 1235 | Hard |
| 11 | Count Unique Characters of All Substrings | 828 | Hard |
| 12 | Minimum Cost to Change the Final Value of Expression | 1896 | Hard |
| 13 | Number of People Aware of a Secret | 2327 | Medium |
| 14 | Reducing Dishes | 1402 | Hard |

### Key Solutions

**Freedom Trail (LC 514)**
*Idea:* dp[i][j] = min steps to spell key[i..] when ring is at position j.
```
for i = len(key)-1 downto 0:
    for j = 0 to len(ring)-1:
        dp[i][j] = INF
        for k where ring[k] == key[i]:
            // distance = min(|j-k|, n-|j-k|) clockwise/counter
            dist = min(abs(j-k), n - abs(j-k))
            dp[i][j] = min(dp[i][j], dist + 1 + dp[i+1][k])
return dp[0][0]
```

---

**Maximum Profit in Job Scheduling (LC 1235)**
*Idea:* Sort by end time. dp[i] = max profit considering first i jobs. Binary search for last non-overlapping job.
```
sort jobs by endTime
dp[0] = 0
for i = 1 to n:
    // binary search: latest job j ending <= start[i]
    j = binarySearch(endTimes, start[i])
    dp[i] = max(dp[i-1], dp[j] + profit[i])
return dp[n]
```

---

**Student Attendance Record II (LC 552)**
*Idea:* State: (days, total_A_count, trailing_L_count). A count in {0,1}, L count in {0,1,2}.
```
// 6 states: (a=0,l=0), (a=0,l=1), (a=0,l=2), (a=1,l=0), (a=1,l=1), (a=1,l=2)
// Transitions on adding P, L, or A
// Matrix exponentiation for O(log n) solution
```

---

## 19. DP on Trees (Rerooting / Advanced)

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Sum of Distances in Tree (rerooting) | 834 | Hard |
| 2 | Minimum Edge Weight Equilibrium (rerooting) | 2846 | Hard |
| 3 | Count Nodes Equal to Sum of Descendants | 1973 | Medium |
| 4 | Maximum Sum BST in Binary Tree | 1373 | Hard |
| 5 | Binary Tree Maximum Path Sum | 124 | Hard |
| 6 | Longest Univalue Path | 687 | Medium |
| 7 | Delete Nodes and Return Forest | 1110 | Medium |
| 8 | Minimum Height Trees | 310 | Medium |

### Key Solutions

**Rerooting Template (used in LC 834, 2846, etc.)**
*Idea:* Two passes on an unrooted tree.
```
// Pass 1: Root at node 0, compute dp[v] bottom-up (post-order)
function dfs1(v, parent):
    for child c of v (c != parent):
        dfs1(c, v)
        dp[v] = combine(dp[v], dp[c])

// Pass 2: Reroot top-down (pre-order)
function dfs2(v, parent):
    ans[v] = dp[v]  // dp[v] now includes contribution from parent
    for child c of v:
        // "remove" c's contribution from v, "add" v's contribution to c
        dp[v] = remove(dp[v], dp[c])
        dp[c] = combine(dp[c], dp[v])
        dfs2(c, v)
        // restore
        dp[c] = remove(dp[c], dp[v])
        dp[v] = combine(dp[v], dp[c])
```

---

**Longest Univalue Path (LC 687)**
*Idea:* At each node, compute longest single-direction path of same value. Update global max with both directions combined.
```
maxLen = 0
function dfs(node):
    if node is null: return 0
    left = dfs(node.left)
    right = dfs(node.right)
    l = left + 1 if node.left and node.left.val == node.val else 0
    r = right + 1 if node.right and node.right.val == node.val else 0
    maxLen = max(maxLen, l + r)
    return max(l, r)
```

---

## 20. Profile / Broken Profile DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Domino and Tromino Tiling | 790 | Medium |
| 2 | Maximum Students Taking Exam | 1349 | Hard |
| 3 | Tiling a 2 x N board (classic) | — | Easy |
| 4 | Number of Ways to Paint N x 3 Grid | 1411 | Hard |
| 5 | Connecting Two Groups of Points | 1595 | Hard |

### Key Solutions

**Domino and Tromino Tiling (LC 790)**
*Idea:* dp[n] = ways to tile a 2xn board. Recurrence considers dominos and trominos.
```
dp[0] = 1, dp[1] = 1, dp[2] = 2
for i = 3 to n:
    dp[i] = 2 * dp[i-1] + dp[i-3]
return dp[n] % MOD
```

---

**Tiling a 2 x N board (classic)**
*Idea:* Same as Fibonacci — either place 1 vertical domino or 2 horizontal dominos.
```
dp[1] = 1, dp[2] = 2
for i = 3 to n:
    dp[i] = dp[i-1] + dp[i-2]
```

---

## 21. SOS (Sum over Subsets) DP

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Count Number of Maximum Bitwise-OR Subsets | 2044 | Medium |
| 2 | Smallest Sufficient Team | 1125 | Hard |
| 3 | Maximum AND Sum of Array | 2172 | Hard |
| 4 | Closest Subsequence Sum (meet-in-the-middle) | 1755 | Hard |
| 5 | Maximize Score After N Operations | 1799 | Hard |
| 6 | Compatible numbers (Codeforces 165E) | — | Hard |

### Key Solutions

**SOS DP Template**
*Idea:* For each bitmask, compute the sum/count over all its submasks in O(n * 2^n) instead of O(3^n).
```
// f[mask] initially holds value for exact mask
// After SOS, f[mask] = sum of f[sub] for all sub ⊆ mask
for bit = 0 to n-1:
    for mask = 0 to (1<<n)-1:
        if mask & (1 << bit):
            f[mask] += f[mask ^ (1 << bit)]
```

---

**Closest Subsequence Sum (LC 1755) — Meet in the Middle**
*Idea:* Split array in half. Enumerate all subset sums of each half (2^(n/2) each). Sort one half, binary search from the other.
```
left_sums = all subset sums of nums[0..n/2]
right_sums = sorted(all subset sums of nums[n/2..n])
for s in left_sums:
    // binary search in right_sums for value closest to (goal - s)
    update answer with closest found
return answer
```

---

## 22. Classic Must-Know Problems (Misc)

| # | Problem | LC # | Difficulty |
|---|---------|------|------------|
| 1 | Trapping Rain Water | 42 | Hard |
| 2 | Maximum Subarray (Kadane's) | 53 | Medium |
| 3 | Maximum Product Subarray | 152 | Medium |
| 4 | Longest Consecutive Sequence | 128 | Medium |
| 5 | Count Primes (sieve + DP) | 204 | Medium |
| 6 | Minimum Window Substring | 76 | Hard |
| 7 | Arithmetic Slices | 413 | Medium |
| 8 | Arithmetic Slices II — Subsequence | 446 | Hard |
| 9 | Largest Divisible Subset | 368 | Medium |
| 10 | Maximum Length of Pair Chain | 646 | Medium |
| 11 | Wiggle Subsequence | 376 | Medium |
| 12 | Longest Turbulent Subarray | 978 | Medium |
| 13 | Counting Bits | 338 | Easy |
| 14 | Range Sum Query 2D — Immutable (prefix DP) | 304 | Medium |
| 15 | Maximal Network Rank | 1615 | Medium |

### Key Solutions

**Kadane's Algorithm — Maximum Subarray (LC 53)**
*Idea:* Either extend the current subarray or start fresh.
```
maxSum = curSum = nums[0]
for i = 1 to n-1:
    curSum = max(nums[i], curSum + nums[i])
    maxSum = max(maxSum, curSum)
return maxSum
```

---

**Maximum Product Subarray (LC 152)**
*Idea:* Track both max and min product (negatives can flip).
```
maxProd = minProd = result = nums[0]
for i = 1 to n-1:
    if nums[i] < 0: swap(maxProd, minProd)
    maxProd = max(nums[i], maxProd * nums[i])
    minProd = min(nums[i], minProd * nums[i])
    result = max(result, maxProd)
return result
```

---

**Trapping Rain Water (LC 42)**
*Idea:* Two pointers. Water at each position = min(maxLeft, maxRight) - height.
```
l = 0, r = n-1, leftMax = 0, rightMax = 0, water = 0
while l < r:
    if height[l] < height[r]:
        leftMax = max(leftMax, height[l])
        water += leftMax - height[l]
        l++
    else:
        rightMax = max(rightMax, height[r])
        water += rightMax - height[r]
        r--
return water
```

---

**Counting Bits (LC 338)**
*Idea:* dp[i] = dp[i >> 1] + (i & 1).
```
for i = 1 to n:
    dp[i] = dp[i >> 1] + (i & 1)
return dp
```

---

**Range Sum Query 2D (LC 304) — 2D Prefix Sum**
*Idea:* prefix[i][j] = sum of rectangle (0,0) to (i-1,j-1). Inclusion-exclusion for queries.
```
// Build:
for i = 1 to m:
    for j = 1 to n:
        prefix[i][j] = matrix[i-1][j-1] + prefix[i-1][j]
                        + prefix[i][j-1] - prefix[i-1][j-1]

// Query (r1,c1) to (r2,c2):
sum = prefix[r2+1][c2+1] - prefix[r1][c2+1]
      - prefix[r2+1][c1] + prefix[r1][c1]
```

---

## Study Tips

**Pattern recognition order** (if starting fresh):
1. 1D linear -> 2D grid -> Subsequence -> Knapsack
2. Interval -> Tree DP -> State machine
3. Bitmask -> Digit -> Game theory
4. SOS -> Profile -> DP with DS optimizations

**For senior/staff rounds, focus heavily on:**
- Interval DP (Burst Balloons, Merge Stones, Strange Printer)
- Bitmask DP (TSP, Shortest Path All Nodes, Smallest Sufficient Team)
- DP + Binary Search optimization (Super Egg Drop, Russian Doll Envelopes)
- Tree DP with rerooting (Sum of Distances in Tree)
- Multi-dimensional state transitions (Freedom Trail, Profitable Schemes)
- Game theory DP (Stone Game variants, Cat and Mouse)
- Digit DP (Numbers With Repeated Digits, Count Special Integers)

**Total: ~300+ problems across 22 categories**
