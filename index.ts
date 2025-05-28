// ベンチマーク用 TypeScript ファイル - index.ts
// 複雑な型定義、ジェネリクス、クラス、インターフェースを含む実用的なコード

import { promises as fs } from 'fs';
import { performance } from 'perf_hooks';

// ===============================
// 基本的な型定義とインターフェース
// ===============================

interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
  profile?: UserProfile;
}

interface UserProfile {
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  skills: string[];
  experience: WorkExperience[];
}

interface WorkExperience {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  technologies: string[];
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showLocation: boolean;
  allowSearchIndexing: boolean;
}

enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

enum CompilerType {
  TSC = 'tsc',
  TSGO = 'tsgo'
}

// ===============================
// 複雑なジェネリック型
// ===============================

type APIResponse<T> = {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions<T>): Promise<T[]>;
  create(data: Omit<T, keyof BaseEntity>): Promise<T>;
  update(id: string, data: DeepPartial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

interface QueryOptions<T> {
  where?: Partial<T>;
  orderBy?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  }[];
  limit?: number;
  offset?: number;
  include?: string[];
}

// ===============================
// ベンチマーク測定クラス
// ===============================

class BenchmarkResult {
  constructor(
    public compiler: CompilerType,
    public executionTime: number,
    public memoryUsage: number,
    public success: boolean,
    public errorMessage?: string
  ) {}

  toJSON(): Record<string, unknown> {
    return {
      compiler: this.compiler,
      executionTime: this.executionTime,
      memoryUsage: this.memoryUsage,
      success: this.success,
      errorMessage: this.errorMessage
    };
  }

  toString(): string {
    const status = this.success ? '✅ Success' : '❌ Failed';
    const time = `${this.executionTime.toFixed(2)}ms`;
    const memory = `${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB`;
    
    return `${this.compiler.toUpperCase()}: ${status} | Time: ${time} | Memory: ${memory}`;
  }
}

class CompilerBenchmark {
  private results: BenchmarkResult[] = [];
  private testFiles: string[] = [];

  constructor(private outputPath: string = './benchmark-results.json') {}

  async generateTestFiles(count: number = 50): Promise<void> {
    console.log(`📝 Generating ${count} test files...`);
    
    for (let i = 0; i < count; i++) {
      const fileName = `test-file-${i}.ts`;
      const content = this.generateComplexTypeScriptCode(i);
      
      await fs.writeFile(fileName, content);
      this.testFiles.push(fileName);
    }
    
    console.log(`✅ Generated ${count} test files`);
  }

  private generateComplexTypeScriptCode(index: number): string {
    return `
// Generated test file ${index}
import { EventEmitter } from 'events';

export interface TestInterface${index}<T extends Record<string, unknown>> {
  id: string;
  data: T;
  metadata: {
    version: number;
    tags: string[];
    permissions: Permission[];
  };
  process<U>(transformer: (input: T) => U): Promise<U>;
}

export interface Permission {
  action: 'read' | 'write' | 'delete' | 'admin';
  resource: string;
  conditions?: Record<string, unknown>;
}

export class DataProcessor${index}<T extends BaseEntity> extends EventEmitter {
  private cache = new Map<string, T>();
  private readonly batchSize = 100;

  constructor(
    private repository: Repository<T>,
    private validator: DataValidator<T>
  ) {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('data:processed', (item: T) => {
      this.cache.set(item.id, item);
    });

    this.on('data:error', (error: Error) => {
      console.error('Processing error:', error);
    });
  }

  async processBatch(items: Omit<T, keyof BaseEntity>[]): Promise<T[]> {
    const results: T[] = [];
    const chunks = this.chunkArray(items, this.batchSize);

    for (const chunk of chunks) {
      try {
        const processed = await Promise.all(
          chunk.map(async (item) => {
            const validated = await this.validator.validate(item);
            const created = await this.repository.create(validated);
            this.emit('data:processed', created);
            return created;
          })
        );
        results.push(...processed);
      } catch (error) {
        this.emit('data:error', error);
        throw error;
      }
    }

    return results;
  }

  private chunkArray<U>(array: U[], size: number): U[][] {
    const chunks: U[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getFromCache(id: string): Promise<T | undefined> {
    return this.cache.get(id);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export interface DataValidator<T> {
  validate(data: unknown): Promise<Omit<T, keyof BaseEntity>>;
  validateBatch(data: unknown[]): Promise<Omit<T, keyof BaseEntity>[]>;
}

export class UserValidator implements DataValidator<User> {
  async validate(data: unknown): Promise<Omit<User, keyof BaseEntity>> {
    if (!this.isValidUserData(data)) {
      throw new Error('Invalid user data');
    }

    return {
      name: data.name,
      email: data.email,
      role: data.role || UserRole.USER,
      preferences: this.validatePreferences(data.preferences),
      profile: data.profile ? this.validateProfile(data.profile) : undefined
    };
  }

  async validateBatch(data: unknown[]): Promise<Omit<User, keyof BaseEntity>[]> {
    return Promise.all(data.map(item => this.validate(item)));
  }

  private isValidUserData(data: unknown): data is Partial<User> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'name' in data &&
      'email' in data &&
      typeof (data as any).name === 'string' &&
      typeof (data as any).email === 'string'
    );
  }

  private validatePreferences(prefs: unknown): UserPreferences {
    const defaultPrefs: UserPreferences = {
      theme: 'auto',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        inApp: true,
        frequency: 'daily'
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showLocation: false,
        allowSearchIndexing: true
      }
    };

    if (!prefs || typeof prefs !== 'object') {
      return defaultPrefs;
    }

    return { ...defaultPrefs, ...prefs as Partial<UserPreferences> };
  }

  private validateProfile(profile: unknown): UserProfile {
    const defaultProfile: UserProfile = {
      skills: [],
      experience: []
    };

    if (!profile || typeof profile !== 'object') {
      return defaultProfile;
    }

    return { ...defaultProfile, ...profile as Partial<UserProfile> };
  }
}

export class AdvancedAnalytics<T extends BaseEntity> {
  private metrics = new Map<string, number>();

  constructor(private data: T[]) {
    this.calculateMetrics();
  }

  private calculateMetrics(): void {
    this.metrics.set('totalCount', this.data.length);
    this.metrics.set('averageAge', this.calculateAverageAge());
    this.metrics.set('recentItems', this.countRecentItems());
  }

  private calculateAverageAge(): number {
    const now = new Date().getTime();
    const ages = this.data.map(item => now - item.createdAt.getTime());
    return ages.reduce((sum, age) => sum + age, 0) / ages.length;
  }

  private countRecentItems(): number {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.data.filter(item => item.createdAt > oneDayAgo).length;
  }

  getMetric(key: string): number | undefined {
    return this.metrics.get(key);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  async generateReport(): Promise<AnalyticsReport${index}> {
    const report: AnalyticsReport${index} = {
      timestamp: new Date(),
      totalItems: this.data.length,
      metrics: this.getAllMetrics(),
      topCategories: await this.getTopCategories(),
      trends: await this.calculateTrends()
    };

    return report;
  }

  private async getTopCategories(): Promise<Array<{ name: string; count: number }>> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return [
      { name: 'Category A', count: Math.floor(Math.random() * 100) },
      { name: 'Category B', count: Math.floor(Math.random() * 100) },
      { name: 'Category C', count: Math.floor(Math.random() * 100) }
    ];
  }

  private async calculateTrends(): Promise<TrendData[]> {
    await new Promise(resolve => setTimeout(resolve, 5));
    
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      value: Math.floor(Math.random() * 1000) + index * 10
    }));
  }
}

export interface AnalyticsReport${index} {
  timestamp: Date;
  totalItems: number;
  metrics: Record<string, number>;
  topCategories: Array<{ name: string; count: number }>;
  trends: TrendData[];
}

export interface TrendData {
  date: Date;
  value: number;
}

// 複雑な関数型プログラミングのユーティリティ
export const AsyncUtils${index} = {
  pipe: <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value),

  compose: <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), value),

  curry: <A, B, C>(fn: (a: A, b: B) => C) => (a: A) => (b: B) => fn(a, b),

  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  debounce: <T extends (...args: any[]) => void>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  throttle: <T extends (...args: any[]) => void>(
    fn: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
};

export default DataProcessor${index};
`;
  }

  async measureCompiler(compiler: CompilerType): Promise<BenchmarkResult> {
    console.log(`🔧 Testing ${compiler.toUpperCase()}...`);
    
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const { spawn } = await import('child_process');
      const command = compiler === CompilerType.TSC ? 'npx' : 'npx';
      const args = compiler === CompilerType.TSC ? ['tsc', '--noEmit'] : ['tsgo', '--noEmit'];

      await new Promise<void>((resolve, reject) => {
        const process = spawn(command, args, { stdio: 'pipe' });
        
        let stderr = '';
        process.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Compiler exited with code ${code}: ${stderr}`));
          }
        });

        process.on('error', reject);
      });

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      return new BenchmarkResult(
        compiler,
        endTime - startTime,
        endMemory - startMemory,
        true
      );

    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      return new BenchmarkResult(
        compiler,
        endTime - startTime,
        endMemory - startMemory,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async runBenchmark(): Promise<void> {
    console.log('🚀 Starting TypeScript Compiler Benchmark');
    console.log('==========================================\n');

    // テストファイルを生成
    await this.generateTestFiles(25);

    // TSC のベンチマーク
    const tscResult = await this.measureCompiler(CompilerType.TSC);
    this.results.push(tscResult);

    // TSGo のベンチマーク
    const tsgoResult = await this.measureCompiler(CompilerType.TSGO);
    this.results.push(tsgoResult);

    // 結果を表示
    this.displayResults();

    // 結果をファイルに保存
    await this.saveResults();

    // テストファイルをクリーンアップ
    await this.cleanup();
  }

  private displayResults(): void {
    console.log('\n📊 Benchmark Results');
    console.log('====================\n');

    this.results.forEach(result => {
      console.log(result.toString());
    });

    // 速度比較
    const tscResult = this.results.find(r => r.compiler === CompilerType.TSC);
    const tsgoResult = this.results.find(r => r.compiler === CompilerType.TSGO);

    if (tscResult?.success && tsgoResult?.success) {
      const speedup = tscResult.executionTime / tsgoResult.executionTime;
      console.log(`\n🎯 TSGo is ${speedup.toFixed(2)}x faster than TSC`);
      
      const memoryReduction = ((tscResult.memoryUsage - tsgoResult.memoryUsage) / tscResult.memoryUsage) * 100;
      if (memoryReduction > 0) {
        console.log(`💾 TSGo uses ${memoryReduction.toFixed(1)}% less memory`);
      } else {
        console.log(`💾 TSGo uses ${Math.abs(memoryReduction).toFixed(1)}% more memory`);
      }
    }
  }

  private async saveResults(): Promise<void> {
    const results = {
      timestamp: new Date().toISOString(),
      results: this.results.map(r => r.toJSON()),
      summary: this.generateSummary()
    };

    await fs.writeFile(this.outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to ${this.outputPath}`);
  }

  private generateSummary(): Record<string, unknown> {
    const tscResult = this.results.find(r => r.compiler === CompilerType.TSC);
    const tsgoResult = this.results.find(r => r.compiler === CompilerType.TSGO);

    return {
      testFilesCount: this.testFiles.length,
      tscSuccess: tscResult?.success ?? false,
      tsgoSuccess: tsgoResult?.success ?? false,
      speedupRatio: (tscResult?.success && tsgoResult?.success) 
        ? tscResult.executionTime / tsgoResult.executionTime 
        : null
    };
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test files...');
    
    for (const file of this.testFiles) {
      try {
        await fs.unlink(file);
      } catch (error) {
        console.warn(`Failed to delete ${file}:`, error);
      }
    }
    
    console.log('✅ Cleanup completed');
  }
}

// メイン実行関数
async function main(): Promise<void> {
  const benchmark = new CompilerBenchmark();
  
  try {
    await benchmark.runBenchmark();
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  main().catch(console.error);
}

export { CompilerBenchmark, BenchmarkResult, CompilerType };