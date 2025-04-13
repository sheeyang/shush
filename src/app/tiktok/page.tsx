'use client';

export default function TikTokPage() {
  // const { data, isStreaming, error, fetchStream, killStream } =
  //   useStreamFetch();
  // const [username, setUsername] = useState('');

  // const handlePing = async () => {
  //   await fetchStream(`http://localhost:3000/api/tiktok/${username}`);
  // };

  return (
    <div className='flex min-h-[calc(100vh-2rem)] flex-col items-center justify-center'>
      {/* <h1 className='mb-8 text-2xl font-bold'>TikTok Utility</h1>
      <div className='flex flex-col items-center'>
        <div className='mb-4 flex w-full max-w-md gap-2'>
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder='Enter TikTok username'
            className='flex-1 rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
          />
          <button
            className='flex items-center justify-center rounded-md border border-solid border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:border-transparent hover:bg-[#f2f2f2] sm:text-base dark:border-white/[.145] dark:hover:bg-[#1a1a1a]'
            onClick={handlePing}
            disabled={isStreaming || !username.trim()}
          >
            {isStreaming ? 'Recording' : 'Record'}
          </button>
          <button
            className='flex h-10 w-full items-center justify-center rounded-md border border-solid border-red-500 px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 sm:h-12 sm:w-auto sm:px-5 sm:text-base md:w-[158px] dark:hover:bg-red-900/20'
            onClick={killStream}
            disabled={!isStreaming}
          >
            Stop
          </button>
        </div>
        <CommandOutput output={data} error={error} />
      </div> */}
    </div>
  );
}
