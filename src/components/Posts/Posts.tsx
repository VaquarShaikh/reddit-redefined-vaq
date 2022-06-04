import { Stack } from "@chakra-ui/react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Community } from "../../atoms/communitiesAtom";
import { Post } from "../../atoms/postAtom";
import { auth, firestore } from "../../firebase/clientApp";
import usePosts from "../../hooks/usePosts";
import PostItem from "./PostItem";
import PostLoader from "./PostLoader";

type PostsProps = {
    communityData: Community
};

const Posts:React.FC<PostsProps> = ({communityData}) => {
    const [user] = useAuthState(auth)
    const [loading , setLoading] = useState(false)
    const {
      postStateValue,
      setPostStateValue,
      onVote,
      onSelectPost,
      onDeletePost,
    } = usePosts();

    const getPosts = async () => {
        try {
            setLoading(true)
            const postQuery = query(
              collection(firestore, "posts"),
              where("communityId", "==", communityData.id),
              orderBy('createdAt' , 'desc')
            );
            // Store in our post state.
            const postDocs = await getDocs(postQuery)
            const posts = postDocs.docs.map(doc => ({id: doc.id, ...doc.data() }))

            setPostStateValue(prev => ({
                ...prev,
                posts: posts as Post[],
            }))

            // console.log("posts , " , posts)
        } catch (error:any) {
            console.log("getPosts error , " , error.message)
        }
        setLoading(false)
    }

    useEffect(() => {
        getPosts()
    } , [communityData])
    
    return (
      <>
        {loading ? (
          <PostLoader />
        ) : (
          <Stack>
            {postStateValue.posts.map((item) => (
              <PostItem
                key={item.id}
                post={item}
                userIsCreator={user?.uid === item.creatorId}
                userVoteValue={
                    postStateValue.postVotes.find((vote) => vote.postId === item.id)
                      ?.voteValue
                  }
                onVote={onVote}
                onSelectPost={onSelectPost}
                onDeletePost={onDeletePost}
              />
            ))}
          </Stack>
        )}
      </>
    );
}
export default Posts;