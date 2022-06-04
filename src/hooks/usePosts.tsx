import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { authModalState } from "../atoms/authModalAtom";
import { communityState } from "../atoms/communitiesAtom";
import { Post, postState, PostVote } from "../atoms/postAtom";
import { auth, firestore, storage } from "../firebase/clientApp";

// updatedPost ==>>>> updatePost

const usePosts = () => {

    
    
    const [postStateValue , setPostStateValue] = useRecoilState(postState)
    const router = useRouter()
    const [user] = useAuthState(auth)
    const currentCommunity = useRecoilValue(communityState).currentCommunity
    const setAuthModalState = useSetRecoilState(authModalState)

    const onVote = async (
      event: React.MouseEvent<SVGElement, MouseEvent>,
      post: Post,
      vote: number,
      communityId: string
    ) => {
        event.stopPropagation()
      // check for a user to be authenticated , if not open authentication model
      if (!user?.uid) {
        setAuthModalState({ open: true, view: "login" });
        return;
      }
      try {
        const { voteStatus } = post;

        const existingVote = postStateValue.postVotes.find(
          (vote) => vote.postId === post.id
        );

        const batch = writeBatch(firestore);
        const updatePost = { ...post };
        const updatedPosts = [...postStateValue.posts];
        let updatedPostVotes = [...postStateValue.postVotes];

        let voteChange = vote;

        // new vote

        if (!existingVote) {
          const postVoteRef = doc(
            collection(firestore, "users", `${user?.uid}/postVotes`)
          );

          const newVote: PostVote = {
            id: postVoteRef.id,
            postId: post.id!,
            communityId,
            voteValue: vote, //1 or -1
          };
          // add / subtract 1
          batch.set(postVoteRef, newVote);

          updatePost.voteStatus = voteStatus + vote;
          updatedPostVotes = [...updatedPostVotes, newVote];
        } else {
          const postVoteRef = doc(
            firestore,
            "users",
            `${user?.uid}/postVotes/${existingVote.id}`
          );
          // Removing the vote
          if (existingVote.voteValue === vote) {
            // add or subtract 1 from post.voteStatus
            updatePost.voteStatus = voteStatus - vote;
            updatedPostVotes = updatedPostVotes.filter(
              (vote) => vote.id !== existingVote.id
            );
            // delete the post vote document
            batch.delete(postVoteRef);

            voteChange *= -1;
          } else {
            // changing their vote (flipping their vote) , subtract by 2
            updatePost.voteStatus = voteStatus + 2 * vote;

            const voteIdx = postStateValue.postVotes.findIndex(
              (vote) => vote.id === existingVote.id
            );

            updatedPostVotes[voteIdx] = {
              ...existingVote,
              voteValue: vote,
            };

            // updating the existing the postvote document
            batch.update(postVoteRef, {
              voteValue: vote,
            });
            voteChange = 2 * vote;
          }
        }
        // update our state
        const postIdx = postStateValue.posts.findIndex(
          (item) => item.id === post.id
        );
        updatedPosts[postIdx] = updatePost;
        setPostStateValue((prev) => ({
          ...prev,
          posts: updatedPosts,
          postVotes: updatedPostVotes,
        }));

        if (postStateValue.selectedPost) {
          setPostStateValue((prev) => ({
            ...prev,
            selectedPost: updatePost,
          }));
        }

        // update our post document in our database
        const postRef = doc(firestore, "posts", post.id!);

        batch.update(postRef, { voteStatus: voteStatus + voteChange });

        await batch.commit();
      } catch (error: any) {
        console.log("onvote error : ", error.message);
      }
    };

    const onSelectPost = (post: Post) => {
        setPostStateValue(prev => ({
            ...prev,
            selectedPost: post,
        }))

        router.push(`/r/${post.communityId}/comments/${post.id}`)
    }

    const onDeletePost = async (post: Post): Promise<boolean> => {
        try {
            // Check if an image if there is , delete it
            if(post.imageURL){
                const imageRef = ref(storage , `posts/${post.id}/image`)
                await deleteObject(imageRef)
            }
            // delete post document from firestore 

            const postDocRef = doc(firestore , 'posts' , post.id! )
            await deleteDoc(postDocRef)

            // update recoil state 
            setPostStateValue(prev => ({
                ...prev,
                posts: prev.posts.filter(item => item.id !== post.id),
            }))
        } catch (error:any) {
            return false
        }
        return true
    }
    
    const getCommunityPostVotes = async (communityId: string) => {
        const postVotesQuery = query(
          collection(firestore, "users", `${user?.uid}/postVotes`),
          where("communityId", "==", communityId)
        );

        const postVoteDocs = await getDocs(postVotesQuery)

        const postVotes = postVoteDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPostStateValue(prev => ({
            ...prev,
            postVotes: postVotes as PostVote[]
        }))
    }
    
    useEffect(() => {

        if(!user || !currentCommunity?.id) return;

        getCommunityPostVotes(currentCommunity?.id)
    } , [user , currentCommunity])

    useEffect(() => {
        if(!user){
            // clear user post votes after logout
            setPostStateValue((prev) => ({
                ...prev,
                postVotes: [],
            }))
        }
    } , [user])

    return {
        postStateValue,
        setPostStateValue,
        onVote,
        onSelectPost,
        onDeletePost,
    }
    
}
export default usePosts;