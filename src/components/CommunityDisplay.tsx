import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { Post } from "./PostList";

interface Props {
  communityId: number;
}

interface Community {
  id: number;
  name: string;
  description: string;
}

interface PostWithCommunity extends Post {
  communities: {
    name: string;
  };
}

// 1. Separate fetch functions
const fetchCommunity = async (id: number): Promise<Community | null> => {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Community fetch error:", error);
    return null;
  }
  console.log("DATA: ", data);
  return data;
};

const fetchCommunityPosts = async (
  id: number
): Promise<PostWithCommunity[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*, communities(name)")
    .eq("community_id", id);
  console.log("Joined DATA: ", data);
  if (error) throw error;
  return data || [];
};

export const CommunityDisplay = ({ communityId }: Props) => {
  // 2. Parallel fetch using Promise.all
  const { data, isLoading, error } = useQuery({
    queryKey: ["communityData", communityId],
    queryFn: () =>
      Promise.all([
        fetchCommunity(communityId),
        fetchCommunityPosts(communityId),
      ]),
    // Optional: Set stale time to prevent unnecessary refetches
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 3. Destructure the parallel results
  const [community, posts] = data || [null, []];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        {community?.name || `Community ${communityId}`} Posts
      </h2>

      {posts.length > 0 ? (
        <div className="flex flex-wrap gap-6 justify-center">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">
          No posts in this community yet.
        </p>
      )}
    </div>
  );
};
