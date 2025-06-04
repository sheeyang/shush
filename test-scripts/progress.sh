for i in {1..10}; do
    printf "\rProgress: %d%%" $((i * 10))
    sleep 1
done
echo
